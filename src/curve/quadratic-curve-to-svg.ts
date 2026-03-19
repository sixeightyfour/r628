import { Vec2 } from "../math/vector.generated";
import { BezierQuadratic } from "./bezierify";

export type Bounds = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function quadraticCurveToPath(
  curve: BezierQuadratic[],
  sigfigs: number,
  offset: Vec2,
) {
  let startPoint = curve[0].a;
  const str = (n: number) => n.toPrecision(sigfigs);
  let output = `M ${str(startPoint[0] + offset[0])} ${str(
    startPoint[1] + offset[1],
  )}`;
  let prevpoint = startPoint;

  for (const b of curve) {
    output += `q ${str(b.b[0] - prevpoint[0])} ${str(
      b.b[1] - prevpoint[1],
    )},${str(b.c[0] - prevpoint[0])} ${str(b.c[1] - prevpoint[1])}`;
    prevpoint = b.c;
  }

  return output;
}

export function quadraticCurveToSvgPath(
  curve: BezierQuadratic[],
  offset: Vec2,
  color: string,
  sigfigs: number,
) {
  const pathd = quadraticCurveToPath(curve, sigfigs, offset);
  return `<path d="${pathd}" stroke="${color}" />`;
}

export function islandsToSvg(
  width: number,
  height: number,
  islands: {
    curve: BezierQuadratic[];
    topLeftInImage: Vec2;
    color: string;
  }[],
  sigfigs: number,
) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${islands
    .map((i) =>
      quadraticCurveToSvgPath(i.curve, i.topLeftInImage, i.color, sigfigs),
    )
    .join("")}</svg>`;
}
