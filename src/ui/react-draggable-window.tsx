import React, {
  createContext,
  Ref,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  add2,
  cart2Polar,
  div2,
  mix2,
  mul2,
  remap2,
  sub2,
  Vec2,
} from "../math/vector.generated";
import { useLatest } from "./use-latest";
import { Rect } from "../spatial-hash-table";
import { lerp, rescale } from "../interpolation";

const DraggableWindowContext = createContext<{
  currentScaleFactors: Vec2;
  pos: Vec2;
  setPos: (pos: Vec2) => void;
}>(undefined);

export function useParentDims(
  getParent: (elem: HTMLElement) => HTMLElement | undefined,
) {
  const [parentDims, setParentDims] = useState([1, 1] as Vec2);

  const elemRef = useRef<HTMLElement | null>(null);

  function updateParentDims() {
    if (!elemRef.current) return;
    const parent = getParent(elemRef.current);
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    setParentDims([rect.width, rect.height]);
  }

  useEffect(() => {
    if (!elemRef.current) return;
    const parent = getParent(elemRef.current);
    if (!parent) return;
    updateParentDims();
  }, []);

  useEffect(() => {
    if (!elemRef.current) return;
    const parent = getParent(elemRef.current);
    if (!parent) return;
    const observer = new ResizeObserver(() => {
      updateParentDims();
    });
    observer.observe(parent);
    return () => {
      observer.disconnect();
    };
  });

  return [elemRef, parentDims] as const;
}

export function DraggableWindow(props: {
  transform: Rect;
  children: React.ReactNode;
  pos: Vec2;
  setPos: (pos: Vec2) => void;
}) {
  const transformedX = rescale(
    props.pos[0],
    props.transform.a[0],
    props.transform.b[0],
    0,
    100,
  );
  const transformedY = rescale(
    props.pos[1],
    props.transform.a[1],
    props.transform.b[1],
    0,
    100,
  );

  const [elemRef, parentDims] = useParentDims((e) => e.parentElement);

  return (
    <DraggableWindowContext.Provider
      value={{
        pos: props.pos,
        setPos: props.setPos,
        currentScaleFactors: div2(
          sub2(props.transform.b, props.transform.a),
          parentDims,
          // [100, 100]
        ),
      }}
    >
      <div
        ref={elemRef as Ref<HTMLDivElement>}
        className="draggable-window"
        style={{
          position: "absolute",
          top: `${transformedY}%`,
          left: `${transformedX}%`,
        }}
      >
        {props.children}
      </div>
    </DraggableWindowContext.Provider>
  );
}

export function LineSeg(props: { transform: Rect; endpoints: Rect }) {
  const [elemRef, parentDims] = useParentDims((e) => e.parentElement);

  const remappedEndpointA = remap2(
    props.endpoints.a,
    props.transform.a,
    props.transform.b,
    [0, 0],
    parentDims,
  );

  const remappedEndpointB = remap2(
    props.endpoints.b,
    props.transform.a,
    props.transform.b,
    [0, 0],
    parentDims,
  );

  const [dist, dir] = cart2Polar(sub2(remappedEndpointB, remappedEndpointA));

  return (
    <div
      ref={elemRef as Ref<HTMLDivElement>}
      className="line-segment"
      style={{
        position: "absolute",
        transformOrigin: "top left",
        height: "1px",
        width: `${dist}px`,
        transform: `rotate(${dir}rad)`,
        left: `${remappedEndpointA[0]}px`,
        top: `${remappedEndpointA[1]}px`,
      }}
    ></div>
  );
}

export function Dragger(props: { children: React.ReactNode }) {
  const { pos, setPos, currentScaleFactors } = useContext(
    DraggableWindowContext,
  )!;
  const elemRef = useRef<HTMLDivElement | null>(null);

  const [isHeld, setIsHeld] = useState(false);

  const tempPosRef = useRef<Vec2>([0, 0]);

  useEffect(() => {
    if (!isHeld) return;
    const elem = elemRef.current;
    if (!elem) return;

    const mousemove = (evt: MouseEvent) => {
      tempPosRef.current = add2(
        tempPosRef.current,
        mul2([evt.movementX, evt.movementY], currentScaleFactors),
      );

      setPos(tempPosRef.current);

      evt.stopPropagation();
    };

    document.addEventListener("mousemove", mousemove);

    return () => {
      document.removeEventListener("mousemove", mousemove);
    };
  }, [isHeld]);

  useEffect(() => {
    const elem = elemRef.current;
    if (!elem) return;

    const mouseup = (evt: MouseEvent) => {
      setIsHeld(false);
      elem.style.userSelect = "";
    };

    const mousedown = (evt: MouseEvent) => {
      setIsHeld(true);
      tempPosRef.current = pos;
      elem.style.userSelect = "none";
      evt.stopPropagation();
    };

    elem.addEventListener("mousedown", mousedown);
    document.addEventListener("mouseup", mouseup);

    return () => {
      elem.removeEventListener("mousedown", mousedown);
      document.removeEventListener("mouseup", mouseup);
    };
  }, [pos, currentScaleFactors]);

  return (
    <div className="dragger" ref={elemRef}>
      {props.children}
    </div>
  );
}
