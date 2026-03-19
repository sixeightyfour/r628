import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { textureDisplayer, TextureDisplayer } from "./display-texture";
import {
  TEXTURE_FORMAT_TO_WGSL_TYPE_LUT,
  TextureFormat,
  WGSL_BASE_TYPE_TO_SAMPLER_TYPE,
  WGSL_TYPE_DATATYPES,
} from "../converters";
import { Buffers, Textures } from "./gpudoc";
import GPUDocCss from "./gpudoc.css?raw";
import {
  add3,
  rescale2,
  sub2,
  Vec2,
  Vec3,
  Vec4,
} from "../../math/vector.generated";
import { v4 } from "uuid";
import { PanAndZoom, TransformHTML } from "../../ui/pan-and-zoom";
import { Rect } from "../../spatial-hash-table";
import { NumberField } from "../../ui/react-number-field";
import { xray } from "../../xray";
import { range } from "../../range";
import {
  DraggableWindow,
  Dragger,
  LineSeg,
} from "../../ui/react-draggable-window";
import { clamp, rescale } from "../../interpolation";
import {
  lineIntersectRect,
  lineIntersectRectClosest,
  sampleLineSegment,
} from "../../math/intersections";
import { readPixelsToCpuBuffer } from "../readpixels";

type TexelInspectorWindowState = {
  samplePos: Vec2;
  layer: number;
  pos: Vec2;
  id: string;
};

type GPUDocTab =
  | {
      type: "search-texture";
      search: string;
      id: string;
    }
  | {
      type: "inspect-texture";
      tex: GPUTexture;
      id: string;
      coords: Rect;
      dark: Vec4;
      light: Vec4;
      texelInspectorWindows: TexelInspectorWindowState[];
    };

type GPUDocContextType = {
  displayer: TextureDisplayer;
  device: GPUDevice;
  textures: Textures;
  buffers: Buffers;
  tabs: GPUDocTab[];
  setTabs: (tabs: GPUDocTab[]) => void;
  setCurrentTabIndex: (i: number) => void;
  currentTabIndex: number;
};

const GPUDocContext = createContext<GPUDocContextType | undefined>(undefined);

export function gpuDebugWindow(params: {
  textures: Textures;
  buffers: Buffers;
  device: GPUDevice;
}) {
  const d = document.createElement("div");

  const root = createRoot(d).render(
    <GpudocDebugWindow
      device={params.device}
      textures={params.textures}
      buffers={params.buffers}
    ></GpudocDebugWindow>,
  );

  return d;
}

function GpudocDebugWindow(props: {
  textures: Textures;
  buffers: Buffers;
  device: GPUDevice;
}) {
  const displayer = useMemo(
    () => textureDisplayer(props.device),
    [props.device],
  );

  const [tabs, setTabs] = useState<GPUDocTab[]>([
    {
      type: "search-texture",
      search: "",
      id: v4(),
    },
  ]);

  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const currentTab = tabs[currentTabIndex];

  return (
    <GPUDocContext.Provider
      value={{
        displayer,
        device: props.device,
        tabs,
        currentTabIndex,
        setCurrentTabIndex,
        setTabs,
        textures: props.textures,
        buffers: props.buffers,
      }}
    >
      <style>{GPUDocCss}</style>
      <div className="gpudoc">
        <GpudocTabBar></GpudocTabBar>
        <div className="tab">
          <GpudocTab
            tab={currentTab}
            setTab={(newtab) =>
              setTabs((oldtabs) =>
                oldtabs.map((t, i) => (i === currentTabIndex ? newtab(t) : t)),
              )
            }
          ></GpudocTab>
        </div>
      </div>
    </GPUDocContext.Provider>
  );
}

function GpudocTab(props: {
  tab: GPUDocTab;
  setTab: (s: (oldtab: GPUDocTab) => GPUDocTab) => void;
}) {
  const tab = props.tab;

  const { textures, tabs } = useGpudoc();

  if (tab.type === "search-texture") {
    return (
      <ul className="tex-thumbs">
        {[...textures].map((t) => (
          <TextureThumbnail tex={t.tex} key={t.id}></TextureThumbnail>
        ))}
      </ul>
    );
  } else {
    return (
      <div
        className="tex-inspector"
        ref={(elem) => {
          const listener = (e: WheelEvent) => {
            e.preventDefault();
          };

          elem.addEventListener("wheel", listener);
          return () => {
            elem.removeEventListener("wheel", listener);
          };
        }}
      >
        <div className="ui">
          <div className="color-sliders">
            <div className="dark-label">Dark</div>
            <div className="light-label">Light</div>
            <div className="dark">
              {range(4).map((i: 0 | 1 | 2 | 3) => (
                <NumberField
                  key={i}
                  value={tab.dark[i]}
                  setValue={(v) =>
                    props.setTab(
                      (oldtab: GPUDocTab & { type: "inspect-texture" }) =>
                        xray(oldtab).dark.$i(i).$(v).$v,
                    )
                  }
                  jumpstartDragFromZero={0.01}
                ></NumberField>
              ))}
            </div>
            <div className="light">
              {range(4).map((i: 0 | 1 | 2 | 3) => (
                <NumberField
                  key={i}
                  value={tab.light[i]}
                  setValue={(v) =>
                    props.setTab(
                      (oldtab: GPUDocTab & { type: "inspect-texture" }) =>
                        xray(oldtab).light.$i(i).$(v).$v,
                    )
                  }
                  jumpstartDragFromZero={0.01}
                ></NumberField>
              ))}
            </div>
          </div>
        </div>
        <PanAndZoom
          coords={tab.coords}
          setCoords={(coords) => {
            props.setTab((oldtab) => ({
              ...oldtab,
              // @ts-expect-error
              coords: coords(oldtab.coords),
            }));
          }}
        >
          {tab.texelInspectorWindows.map((t, i) => (
            <TexelInspectorWindow
              tab={tab}
              key={t.id}
              win={t}
              setWin={(w) =>
                props.setTab(
                  (oldtab) =>
                    xray(oldtab as GPUDocTab & { type: "inspect-texture" })
                      .texelInspectorWindows.$i(i)
                      .$(w).$v,
                )
              }
            ></TexelInspectorWindow>
          ))}
          <TextureCanvas
            tex={tab.tex}
            useCalculatedSize
            cornerA={tab.coords.a}
            cornerB={tab.coords.b}
            dark={tab.dark}
            light={tab.light}
          ></TextureCanvas>
        </PanAndZoom>
      </div>
    );
  }
}

function TexelInspectorWindow(props: {
  tab: GPUDocTab & { type: "inspect-texture" };
  win: TexelInspectorWindowState;
  setWin: (win: TexelInspectorWindowState) => void;
}) {
  const { win, tab } = props;
  const { device } = useGpudoc();

  const texelCoords: Vec3 = [
    clamp(Math.floor(win.samplePos[0] * tab.tex.width), 0, tab.tex.width - 1),
    clamp(Math.floor(win.samplePos[1] * tab.tex.height), 0, tab.tex.height - 1),
    clamp(win.layer, 0, tab.tex.depthOrArrayLayers - 1),
  ];

  const roundedSamplePos: Vec2 = [
    texelCoords[0] / tab.tex.width,
    texelCoords[1] / tab.tex.height,
  ];

  const texelMarkerX = rescale(
    roundedSamplePos[0],
    tab.coords.a[0],
    tab.coords.b[0],
    0,
    100,
  );
  const texelMarkerY = rescale(
    roundedSamplePos[1],
    tab.coords.a[1],
    tab.coords.b[1],
    0,
    100,
  );

  const area = sub2(tab.coords.b, tab.coords.a);

  const lineseg = {
    b: [
      roundedSamplePos[0] + 0.5 / tab.tex.width,
      roundedSamplePos[1] + 0.5 / tab.tex.height,
    ] as Vec2,
    a: win.pos,
  };

  const segEndpointA = sampleLineSegment(
    lineseg,
    lineIntersectRectClosest(lineseg, {
      a: roundedSamplePos,
      b: [
        roundedSamplePos[0] + 1 / tab.tex.width,
        roundedSamplePos[1] + 1 / tab.tex.height,
      ],
    }),
  );

  const [pixel, setPixel] = useState<Vec4>([0, 0, 0, 0]);

  useEffect(() => {
    (async () => {
      const tempBuf = device.createBuffer({
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        size: 16,
      });
      const b = await readPixelsToCpuBuffer({
        tex: tab.tex,
        aspect: "all",
        buf: tempBuf,
        subregion: [texelCoords, add3(texelCoords, [1, 1, 1])],
        device,
      });

      const ui8a = new Uint8Array(b.cpuBuffer);

      setPixel([ui8a[0], ui8a[1], ui8a[2], ui8a[3]]);
    })();
  }, [win.samplePos]);

  return (
    <>
      <div
        className="texel-marker"
        style={{
          position: "absolute",
          left: `${texelMarkerX}%`,
          top: `${texelMarkerY}%`,
          width: `${100 / area[0] / tab.tex.width}%`,
          height: `${100 / area[1] / tab.tex.height}%`,
        }}
      ></div>
      <LineSeg
        transform={props.tab.coords}
        endpoints={{
          a: segEndpointA,
          b: win.pos,
        }}
      ></LineSeg>
      <DraggableWindow
        transform={props.tab.coords}
        pos={win.samplePos}
        setPos={(p) => props.setWin(xray(win).samplePos.$(p).$v)}
      >
        <Dragger>
          <div className="texel-dragger"></div>
        </Dragger>
      </DraggableWindow>
      <DraggableWindow
        transform={props.tab.coords}
        pos={win.pos}
        setPos={(p) => props.setWin(xray(win).pos.$(p).$v)}
      >
        <div className="texel-inspector-window">
          <Dragger>
            Texel ({texelCoords[0]}, {texelCoords[1]})
          </Dragger>
          <div className="texel-components">
            <div className="red">{pixel[0]}</div>
            <div className="green">{pixel[1]}</div>
            <div className="blue">{pixel[2]}</div>
            <div className="alpha">{pixel[3]}</div>
          </div>
        </div>
      </DraggableWindow>
    </>
  );
}

function GpudocTabBar() {
  const { tabs, currentTabIndex, setCurrentTabIndex, setTabs } = useGpudoc();

  return (
    <ul className="tab-bar">
      {tabs.map((t, i) => (
        <li
          onClick={() => {
            setCurrentTabIndex(i);
          }}
          key={t.id}
          className={currentTabIndex === i ? "selected" : ""}
        >
          <GpudocTabThumbDisplay tab={t}></GpudocTabThumbDisplay>
        </li>
      ))}
    </ul>
  );
}

function GpudocTabThumbDisplay(props: { tab: GPUDocTab }) {
  const tab = props.tab;

  if (tab.type === "search-texture") {
    return <div>Search Texture</div>;
  } else {
    return <div>Texture: {tab.tex.label}</div>;
  }
}

function TextureThumbnail(props: { tex: GPUTexture }) {
  const { tabs, setTabs, setCurrentTabIndex } = useGpudoc();
  return (
    <li
      onClick={() => {
        setTabs([
          ...tabs,
          {
            type: "inspect-texture",
            tex: props.tex,
            id: v4(),
            coords: { a: [0, 0], b: [1, 1] },
            dark: [0, 0, 0, 0],
            light: [1, 1, 1, 1],
            texelInspectorWindows: [
              {
                samplePos: [0.5, 0.5],
                layer: 0,
                pos: [0.5, 0.5],
                id: v4(),
              },
            ],
          },
        ]);
        setCurrentTabIndex(tabs.length);
      }}
    >
      <div className="name">{props.tex.label}</div>
      <div className="canvas">
        <TextureCanvas tex={props.tex}></TextureCanvas>
      </div>
    </li>
  );
}

function useGpudoc() {
  return useContext(GPUDocContext)!;
}

function setCanvasDims(canvas: HTMLCanvasElement, dims: Vec2) {
  const [width, height] = [Math.round(dims[0]), Math.round(dims[1])];

  if (width !== canvas.width) canvas.width = width;
  if (height !== canvas.height) canvas.height = height;
}

function TextureCanvas(props: {
  tex: GPUTexture;
  canvasDims?: Vec2;
  useCalculatedSize?: boolean;
  cornerA?: [number, number];
  cornerB?: [number, number];
  dark?: Vec4;
  light?: Vec4;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { displayer, device } = useGpudoc();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    const ctx = canvas.getContext("webgpu");
    ctx.configure({
      device: device,
      format: canvasFormat,
    });
  }, [device]);

  function rerender() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    const ctx = canvas.getContext("webgpu");

    const encoder = device.createCommandEncoder();

    const textureWgslType =
      TEXTURE_FORMAT_TO_WGSL_TYPE_LUT[props.tex.format as TextureFormat];
    const wgslBaseType = WGSL_TYPE_DATATYPES[textureWgslType];
    const samplerType = WGSL_BASE_TYPE_TO_SAMPLER_TYPE[wgslBaseType];

    displayer.displayTexture2d(
      {
        tex: props.tex.createView(),
        samplerType: samplerType,
        cornerA: props.cornerA ?? [0, 0],
        cornerB: props.cornerB ?? [1, 1],
        blackEquiv: props.dark ?? [0, 0, 0, 0],
        whiteEquiv: props.light ?? [1, 1, 1, 1],
      },
      {
        tex: ctx.getCurrentTexture().createView(),
        format: canvasFormat as TextureFormat,
      },
      encoder,
    );

    device.queue.submit([encoder.finish()]);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tex = props.tex;
    const dims = [tex.width, tex.height, tex.depthOrArrayLayers] as Vec3;

    if (!props.useCalculatedSize) {
      if (props.canvasDims) {
        setCanvasDims(canvas, props.canvasDims);
      } else {
        setCanvasDims(canvas, dims as unknown as Vec2);
      }
    }

    rerender();
  }, [
    props.tex,
    device,
    props.canvasDims,
    props.cornerA,
    props.cornerB,
    props.dark,
    props.light,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !props.useCalculatedSize) return;
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      setCanvasDims(canvas, [
        rect.width * window.devicePixelRatio,
        rect.height * window.devicePixelRatio,
      ]);
      rerender();
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [props.useCalculatedSize]);

  return <canvas ref={canvasRef}></canvas>;
}
