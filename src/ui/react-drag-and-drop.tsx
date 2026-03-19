import React, { useContext, useEffect, useRef, useState } from "react";
import { createContext } from "react";
import { Vec2 } from "../math/vector.generated";

export type DragAndDrop<T> = ReturnType<typeof createDragContext<T>>;

export function createDragContext<T>() {
  const DragContext = createContext<{
    dragCtx: T | undefined;
    setDragCtx: (v: T | undefined) => void;
    destinationCallbacks: React.RefObject<Set<() => void>>;
    endDragCallbacks: React.RefObject<Set<() => void>>;
  }>(undefined);

  return {
    DragContext,
    DragContextContainer(props: {
      dragCtx: T | undefined;
      setDragCtx: (t: T | undefined) => void;
      children?: React.ReactNode | undefined;
    }) {
      const { dragCtx, setDragCtx } = props;

      const destinationCallbacks = useRef(new Set<() => void>());
      const endDragCallbacks = useRef(new Set<() => void>());

      useEffect(() => {
        if (dragCtx === undefined) return;

        const mouseup = () => {
          setDragCtx(undefined);
          document.body.style.userSelect = "";

          for (const cb of [...destinationCallbacks.current]) {
            destinationCallbacks.current.delete(cb);
          }

          for (const cb of [...endDragCallbacks.current]) {
            cb();
            endDragCallbacks.current.delete(cb);
          }
        };

        document.addEventListener("mouseup", mouseup);

        return () => {
          document.removeEventListener("mouseup", mouseup);
        };
      }, [dragCtx]);

      return (
        <DragContext.Provider
          value={{
            dragCtx,
            setDragCtx,
            destinationCallbacks,
            endDragCallbacks,
          }}
        >
          {props.children}
        </DragContext.Provider>
      );
    },
    DragSource(props: {
      value: T;
      children?: React.ReactNode | undefined;
      onStartDrag?: () => void;
      onEndDrag?: () => void;
      onReachDestination: () => void;
    }) {
      const { dragCtx, setDragCtx, destinationCallbacks, endDragCallbacks } =
        useContext(DragContext);

      return (
        <div
          className="drag-source"
          onMouseDown={() => {
            props.onStartDrag?.();
            document.getSelection().removeAllRanges();
            document.body.style.userSelect = "none";
            setDragCtx(props.value);
            destinationCallbacks.current.add(props.onReachDestination);
            if (props.onEndDrag) {
              endDragCallbacks.current.add(props.onEndDrag);
              console.log("hello?");
              console.log(endDragCallbacks.current);
            }
          }}
        >
          {props.children}
        </div>
      );
    },
    DragDestination(props: {
      children?: React.ReactNode | undefined;
      onSetValue: (t: T) => void;
    }) {
      const { dragCtx, setDragCtx, destinationCallbacks, endDragCallbacks } =
        useContext(DragContext);

      return (
        <div
          className={
            dragCtx === undefined
              ? "drag-destination"
              : "drag-destination drag-active"
          }
          onMouseUp={() => {
            if (dragCtx === undefined) return;

            for (const cb of [...destinationCallbacks.current]) {
              cb();
              destinationCallbacks.current.delete(cb);
            }
            for (const cb of [...endDragCallbacks.current]) {
              cb();
              endDragCallbacks.current.delete(cb);
            }
            props.onSetValue(dragCtx);
            setDragCtx(undefined);
          }}
        >
          {props.children}
        </div>
      );
    },
    DragFloat(props: { children?: React.ReactNode | undefined }) {
      const { dragCtx, setDragCtx } = useContext(DragContext);

      const [pos, setPos] = useState<Vec2>([0, 0]);

      useEffect(() => {
        const listener = (e: MouseEvent) => {
          setPos([e.clientX, e.clientY]);
        };

        document.addEventListener("mousemove", listener);

        return () => {
          document.removeEventListener("mousemove", listener);
        };
      }, []);

      if (dragCtx === undefined) return <></>;

      return (
        <div
          className="drag-float"
          style={{
            position: "fixed",
            top: pos[1] + 40 + "px",
            left: pos[0] + 40 + "px",
          }}
        >
          {props.children}
        </div>
      );
    },
  };
}
