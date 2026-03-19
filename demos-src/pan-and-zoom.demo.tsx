import { useEffect, useRef, useState } from "react";
import { PanAndZoom, panAndZoomCanvas2d, Rect } from "../src/ui/pan-and-zoom";
import { mount } from "./react-boilerplate";

mount(() => {
  const [rect, setRect] = useState<Rect>({
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 100,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.save();
    panAndZoomCanvas2d(canvasRef.current, ctx, rect);
    ctx.fillText("Test pan/zoom", 10, 10);
    ctx.fillRect(rect.x1, rect.y1, 10, 10);
    ctx.fillRect(rect.x2 - 10, rect.y2 - 10, 10, 10);
    ctx.restore();
  }, [rect]);

  return (
    <PanAndZoom coords={rect} setCoords={setRect}>
      <canvas width="512" height="512" ref={canvasRef}></canvas>
    </PanAndZoom>
  );
});
