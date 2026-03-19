import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Vec2 } from "../math/vector.generated";
import React from "react";

const Tooltips = createContext<TooltipContext>({
  setTooltip() {},
  tooltip: undefined,
});

function useTooltips() {
  const { tooltip, setTooltip } = useContext(Tooltips);

  const isTouchscreen = useIsTouchscreen();

  return {
    tooltip,
    setTooltip,
    attachTooltip(html: React.FC, selectedId: number) {
      return (e: HTMLElement | null) => {
        if (!e) return;

        if (isTouchscreen) {
          const touch = (e: TouchEvent) => {
            setTooltip({
              html,
              selectedId,
            });
          };

          e.addEventListener("touchstart", touch);

          return () => {
            e.removeEventListener("touchstart", touch);
          };
        }

        const enter = (e: MouseEvent) => {
          setTooltip({
            html,
            selectedId,
          });
        };
        const leave = (e: MouseEvent) => {
          setTooltip(undefined);
        };

        e.addEventListener("mouseenter", enter);
        e.addEventListener("mouseleave", leave);

        return () => {
          e.removeEventListener("mouseenter", enter);
          e.removeEventListener("mouseleave", leave);
        };
      };
    },
  };
}

function useMedia(query: string) {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const m = window.matchMedia(query);

    setMatches(m.matches);

    m.addEventListener("change", () => {
      setMatches(m.matches);
    });
  }, []);

  return matches;
}

function useIsTouchscreen() {
  return useMedia("(pointer: coarse)");
}

function TooltipWindow() {
  const { tooltip, setTooltip } = useTooltips();

  const [mousePos, setMousePos] = useState<Vec2>([0, 0]);

  const isTouchscreen = useIsTouchscreen();

  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isTouchscreen || !tooltip) return;

    const touchstart = (t: TouchEvent) => {
      if (!tooltipRef.current || !t.target) return;

      if (!tooltipRef.current.contains(t.target as HTMLDivElement)) {
        setTooltip(undefined);
      }
    };

    setTimeout(() => {
      document.addEventListener("touchstart", touchstart);
    });

    return () => {
      document.removeEventListener("touchstart", touchstart);
    };
  }, [isTouchscreen, tooltip]);

  useEffect(() => {
    if (isTouchscreen) {
      const listener = (e: TouchEvent) => {
        if (
          tooltipRef.current &&
          tooltipRef.current.contains(e.target as HTMLElement)
        )
          return;
        setMousePos([e.touches[0].clientX, e.touches[0].clientY]);
      };

      document.addEventListener("touchstart", listener);

      return () => {
        document.removeEventListener("touchstart", listener);
      };
    }

    const listener = (e: MouseEvent) => {
      setMousePos([e.clientX, e.clientY]);
    };

    document.addEventListener("mousemove", listener);

    return () => {
      document.removeEventListener("mousemove", listener);
    };
  }, [isTouchscreen]);

  if (!tooltip) return <></>;

  return (
    <div
      ref={tooltipRef}
      className="tooltip"
      style={{
        left: `${mousePos[0] + 10}px`,
        top: `${mousePos[1] + 10}px`,
        transform:
          (mousePos[0] > window.innerWidth / 2
            ? `translateX(calc(-100% - 20px))`
            : " ") +
          (mousePos[1] > window.innerHeight / 2
            ? `translateY(calc(-100% - 20px))`
            : " "),
      }}
    >
      <tooltip.html></tooltip.html>
    </div>
  );
}

function TooltipProvider(props: React.PropsWithChildren) {
  const [tooltip, setTooltip] = useState<Tooltip | undefined>(undefined);

  return (
    <>
      <Tooltips.Provider value={{ tooltip, setTooltip }}>
        {props.children}
        <TooltipWindow></TooltipWindow>
      </Tooltips.Provider>
    </>
  );
}

type TooltipContext = {
  setTooltip: (t: Tooltip | undefined) => void;
  tooltip: Tooltip | undefined;
};

type Tooltip = {
  html: React.FC;
  selectedId: number;
};
