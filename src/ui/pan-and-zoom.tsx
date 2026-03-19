import React, { ReactNode, useEffect, useRef, useState } from "react";
import { lerp, rescale } from "../interpolation";
import { Mat3x2 } from "../math/vector.generated";
import { Rect } from "../spatial-hash-table";

export function panAndZoomMatrix(
  rect: Rect,
  containerWidth: number,
  containerHeight: number,
): Mat3x2 {
  const scaleX = (1 / (rect.b[0] - rect.a[0])) * containerWidth;
  const scaleY = (1 / (rect.b[1] - rect.a[1])) * containerHeight;

  const translateX = -rect.a[0] * scaleX;
  const translateY = -rect.a[1] * scaleY;

  return [scaleX, 0, 0, scaleY, translateX, translateY];
}

export function panAndZoomCanvas2d(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  rect: Rect,
) {
  ctx.transform(...panAndZoomMatrix(rect, canvas.width, canvas.height));
}

export function TransformHTML(props: { children: ReactNode; coords: Rect }) {
  const coords = props.coords;

  const eref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const e = eref.current;
    if (!e || !e.parentElement) return;

    const rect = e.parentElement.getBoundingClientRect();

    e.style.transformOrigin = "top left";
    e.style.transform = `scale(${1 / rect.width}, ${1 / rect.height}) matrix(${panAndZoomMatrix(coords, rect.width, rect.height)})`;
    e.style.position = "relative";
  }, [props.coords]);

  return <div ref={eref}>{props.children}</div>;
}

export function PanAndZoom(props: {
  children: ReactNode;
  coords: Rect;
  setCoords: (c: (coords: Rect) => Rect) => void;
  onUpdate?: () => void;
  scrollSensitivity?: number;
  scrollDecay?: number;
  scrollSnapToZero?: number;
  swapScroll?: boolean;
}) {
  const scrollSensitivity = props.scrollSensitivity ?? 1;
  const scrollDecay = props.scrollDecay ?? 0.01;
  const scrollSnapToZero = props.scrollSnapToZero ?? 0.001;
  const scrollVel = useRef(0);
  const mouseDown = useRef(false);
  const normalizedMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let stopped = false;
    let lastTime = performance.now();
    const cb = (time: number) => {
      if (stopped) return;
      const deltaTime = time - lastTime;
      lastTime = time;
      scrollVel.current *= Math.pow(scrollDecay, deltaTime / 1000);

      if (Math.abs(scrollVel.current) > scrollSnapToZero) {
        props.setCoords((c) => {
          const targetOriginX = lerp(
            normalizedMousePos.current.x,
            c.a[0],
            c.b[0],
          );
          const targetOriginY = lerp(
            normalizedMousePos.current.y,
            c.a[1],
            c.b[1],
          );
          const scrollAmount = (scrollVel.current * deltaTime) / 1000;
          return {
            a: [
              lerp(scrollAmount, c.a[0], targetOriginX),
              lerp(scrollAmount, c.a[1], targetOriginY),
            ],
            b: [
              lerp(scrollAmount, c.b[0], targetOriginX),
              lerp(scrollAmount, c.b[1], targetOriginY),
            ],
          };
        });
        props.onUpdate?.();
      }

      requestAnimationFrame(cb);
    };
    requestAnimationFrame(cb);
    return () => {
      stopped = true;
    };
  }, []);

  const divref = useRef<HTMLDivElement | null>(null);

  return (
    <div
      style={{
        width: "fit-content",
        display: "flex",
      }}
      ref={divref}
      onWheel={(e) => {
        e.preventDefault();
        scrollVel.current +=
          Math.sign(e.deltaY) * scrollSensitivity * (props.swapScroll ? -1 : 1);
      }}
      onMouseDown={(e) => {
        mouseDown.current = true;
      }}
      onMouseUp={(e) => {
        mouseDown.current = false;
      }}
      onMouseMove={(e) => {
        const rect = divref.current?.getBoundingClientRect();
        if (!rect) return;
        normalizedMousePos.current = {
          x: rescale(e.nativeEvent.offsetX, 0, rect.width, 0, 1),
          y: rescale(e.nativeEvent.offsetY, 0, rect.height, 0, 1),
        };
        if (!mouseDown.current) return;
        props.setCoords((c) => {
          const dx = -rescale(e.movementX, 0, rect.width, 0, c.b[0] - c.a[0]);
          const dy = -rescale(e.movementY, 0, rect.height, 0, c.b[1] - c.a[1]);

          return {
            a: [c.a[0] + dx, c.a[1] + dy],
            b: [c.b[0] + dx, c.b[1] + dy],
          };
        });
        props.onUpdate?.();
      }}
    >
      {props.children}
    </div>
  );
}
