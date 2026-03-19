import { Rect } from "../spatial-hash-table";
import { add2, mix2, pointTo, Vec2 } from "./vector.generated";

type Circle = {
  center: Vec2;
  radius: number;
};

type LineSegment = {
  a: Vec2;
  b: Vec2;
};

type Ray = {
  center: Vec2;
  dir: number;
};

type QuadraticSolution = [] | [number] | [number, number];

function quadraticFormula(a: number, b: number, c: number): QuadraticSolution {
  const bSquaredMinusFourAC = b ** 2 - 4 * a * c;
  if (bSquaredMinusFourAC < 0) return [];
  if (bSquaredMinusFourAC === 0) return [-b / (2 * a)];
  return [
    (-b - Math.sqrt(bSquaredMinusFourAC)) / (2 * a),
    (-b + Math.sqrt(bSquaredMinusFourAC)) / (2 * a),
  ];
}

// https://www.desmos.com/calculator/livkxg6slz
export function circleIntersectLine(circle: Circle, seg: LineSegment) {
  const bxMinusAx = seg.b[0] - seg.a[0];
  const byMinusAy = seg.b[1] - seg.a[1];
  const axMinusCx = seg.a[0] - circle.center[0];
  const ayMinusCy = seg.a[1] - circle.center[1];

  const a = bxMinusAx ** 2 + byMinusAy ** 2;
  const b = 2 * (bxMinusAx * axMinusCx + byMinusAy * ayMinusCy);
  const c = axMinusCx ** 2 + ayMinusCy ** 2 - circle.radius ** 2;

  return quadraticFormula(a, b, c);
}

// https://www.desmos.com/calculator/tawtvqzytk
export function lineIntersectLine(a: LineSegment, b: LineSegment) {
  const ax = a.a[0];
  const ay = a.a[1];
  const bx = a.b[0];
  const by = a.b[1];
  const cx = b.a[0];
  const cy = b.a[1];
  const dx = b.b[0];
  const dy = b.b[1];

  return (
    ((bx - ax) * (ay - cy) + (by - ay) * (cx - ax)) /
    ((bx - ax) * (dy - cy) - (by - ay) * (dx - cx))
  );
}

export function lineSegmentIntersectLineSegment(
  a: LineSegment,
  b: LineSegment,
) {
  const t2 = lineIntersectLine(a, b);
  const t1 = lineIntersectLine(b, a);

  if (t1 < 0 || t1 > 1) return;
  if (t2 < 0 || t2 > 1) return;

  return t2;
}

export function lineIntersectRect(l: LineSegment, rect: Rect) {
  const topIntersect = lineSegmentIntersectLineSegment(
    {
      a: rect.a,
      b: [rect.b[0], rect.a[1]],
    },
    l,
  );
  const bottomIntersect = lineSegmentIntersectLineSegment(
    {
      a: [rect.a[0], rect.b[1]],
      b: rect.b,
    },
    l,
  );
  const leftIntersect = lineSegmentIntersectLineSegment(
    {
      a: rect.a,
      b: [rect.a[0], rect.b[1]],
    },
    l,
  );
  const rightIntersect = lineSegmentIntersectLineSegment(
    {
      a: [rect.b[0], rect.a[1]],
      b: rect.b,
    },
    l,
  );

  return [topIntersect, bottomIntersect, leftIntersect, rightIntersect].filter(
    (i) => i && i >= 0 && i <= 1,
  );
}

export function lineIntersectRectClosest(l: LineSegment, rect: Rect) {
  return Math.min(...lineIntersectRect(l, rect));
}

export function rayIntersectLine(ray: Ray, b: LineSegment) {
  return lineIntersectLine(
    {
      a: ray.center,
      b: add2(ray.center, [Math.cos(ray.dir), Math.sin(ray.dir)]),
    },
    b,
  );
}

export function getSmallestAngleDifference(
  a: number,
  b: number,
): [number, number] {
  const minDiff = Math.min(
    Math.abs(a - b),
    Math.abs(a - b + Math.PI * 2),
    Math.abs(a - b - Math.PI * 2),
  );

  const lowest = Math.min(a, b);

  return [lowest, lowest + minDiff];
}

export function getEqualAngularDivisionsOfLineSegment(
  center: Vec2,
  b: LineSegment,
  interval: number,
): number[] {
  const [angle1, angle2] = getSmallestAngleDifference(
    pointTo(center, b.a),
    pointTo(center, b.b),
  );

  const truncatedAngle1 = Math.ceil(angle1 / interval) * interval;

  let tValues: number[] = [];

  for (let i = truncatedAngle1; i < angle2; i += interval) {
    tValues.push(
      rayIntersectLine(
        {
          center,
          dir: i,
        },
        b,
      ),
    );
  }

  return tValues;
}

export function closestApproachOfLineSegmentToPoint(l: LineSegment, pt: Vec2) {
  const ax = l.a[0];
  const ay = l.a[1];
  const bx = l.b[0];
  const by = l.b[1];
  const cx = pt[0];
  const cy = pt[1];

  return (
    (-(bx - ax) * (ax - cx) - (by - ay) * (ay - cy)) /
    ((bx - ax) ** 2 + (by - ay) ** 2)
  );
}

export function sampleLineSegment(l: LineSegment, t: number) {
  return mix2(t, l.a, l.b);
}

export function rangeIntersects(
  a1: number,
  a2: number,
  b1: number,
  b2: number,
) {
  return !(a1 > b2 || b1 > a2);
}

export function rectIntersects(a: Rect, b: Rect) {
  return (
    rangeIntersects(a.a[0], a.b[0], b.a[0], b.b[0]) &&
    rangeIntersects(a.a[1], a.b[1], b.a[1], b.b[1])
  );
}
