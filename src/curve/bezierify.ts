import { clamp } from "../interpolation";
import {
  add2,
  dot2,
  mul2,
  scale2,
  scale3,
  sub2,
  sub3,
  Vec2,
  Vec3,
} from "../math/vector.generated";

/*
float sdBezier( in vec2 pos, in vec2 A, in vec2 B, in vec2 C )
{    
    vec2 a = B - A;
    vec2 b = A - 2.0*B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;
    float kk = 1.0/dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);      
    float res = 0.0;
    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx-3.0*ky) + kz;
    float h = q*q + 4.0*p3;
    if( h >= 0.0) 
    { 
        h = sqrt(h);
        vec2 x = (vec2(h,-h)-q)/2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = clamp( uv.x+uv.y-kx, 0.0, 1.0 );
        res = dot2(d + (c + b*t)*t);
    }
    else
    {
        float z = sqrt(-p);
        float v = acos( q/(p*z*2.0) ) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3  t = clamp(vec3(m+m,-n-m,n-m)*z-kx,0.0,1.0);
        res = min( dot2(d+(c+b*t.x)*t.x),
                   dot2(d+(c+b*t.y)*t.y) );
        // the third root cannot be the closest
        // res = min(res,dot2(d+(c+b*t.z)*t.z));
    }
    return sqrt( res );
}

*/

function dotself2(x: Vec2) {
  return dot2(x, x);
}

function clamp3(v: Vec3, lo: number, hi: number): Vec3 {
  return [clamp(v[0], lo, hi), clamp(v[1], lo, hi), clamp(v[2], lo, hi)];
}

function min2(a: Vec2, b: Vec2): Vec2 {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1])];
}

function v2(a: number) {
  return [a, a];
}

function sign2(a: Vec2): Vec2 {
  return [Math.sign(a[0]), Math.sign(a[1])];
}

function abs2(a: Vec2): Vec2 {
  return [Math.abs(a[0]), Math.abs(a[1])];
}
function pow2(a: Vec2, b: Vec2): Vec2 {
  return [Math.pow(a[0], b[0]), Math.pow(a[1], b[1])];
}

export function sdBezier(pos: Vec2, A: Vec2, B: Vec2, C: Vec2) {
  // vec2 a = B - A;
  const a = sub2(B, A);
  // vec2 b = A - 2.0*B + C;
  const b = add2(sub2(A, scale2(B, 2.0)), C);
  // vec2 c = a * 2.0;
  const c = scale2(a, 2.0);
  // vec2 d = A - pos;
  const d = sub2(A, pos);
  // float kk = 1.0/dot(b,b);
  const kk = 1 / dot2(b, b);
  // float kx = kk * dot(a,b);
  const kx = kk * dot2(a, b);
  // float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
  const ky = (kk * (2.0 * dot2(a, a) + dot2(d, b))) / 3.0;
  // float kz = kk * dot(d,a);
  const kz = kk * dot2(d, a);
  // float res = 0.0;
  let res = 0.0;
  // float p = ky - kx*kx;
  const p = ky - kx * kx;
  // float p3 = p*p*p;
  const p3 = p * p * p;
  // float q = kx*(2.0*kx*kx-3.0*ky) + kz;
  const q = kx * (2 * kx * kx - 3 * ky) + kz;
  // float h = q*q + 4.0*p3;
  let h = q * q + 4 * p3;
  // if( h >= 0.0)
  if (h >= 0.0) {
    // {
    //     h = sqrt(h);
    h = Math.sqrt(h);
    //     vec2 x = (vec2(h,-h)-q)/2.0;
    const x = scale2(sub2([h, -h], [q, q]), 1 / 2.0);
    //     vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
    const uv = mul2(sign2(x), pow2(abs2(x), [1 / 3, 1 / 3]));
    //     float t = clamp( uv.x+uv.y-kx, 0.0, 1.0 );
    const t = clamp(uv[0] + uv[1] - kx, 0.0, 1.0);
    //     res = dot2(d + (c + b*t)*t);
    res = dotself2(add2(d, scale2(add2(c, scale2(b, t)), t)));
    // }
  } else {
    // else
    // {
    //     float z = sqrt(-p);
    const z = Math.sqrt(-p);
    //     float v = acos( q/(p*z*2.0) ) / 3.0;
    const v = Math.acos(q / (p * z * 2.0)) / 3.0;
    //     float m = cos(v);
    const m = Math.cos(v);
    //     float n = sin(v)*1.732050808;
    const n = Math.sin(v) * 1.732050808;
    //     vec3  t = clamp(vec3(m+m,-n-m,n-m)*z-kx,0.0,1.0);
    const t = clamp3(
      sub3(scale3([m + m, -n - m, n - m], z), [kx, kx, kx]),
      0,
      1,
    );
    //     res = min( dot2(d+(c+b*t.x)*t.x),
    //                dot2(d+(c+b*t.y)*t.y) );
    res = Math.min(
      dotself2(add2(d, scale2(add2(c, scale2(b, t[0])), t[0]))),
      dotself2(add2(d, scale2(add2(c, scale2(b, t[1])), t[1]))),
    );
    //     // the third root cannot be the closest
    //     // res = min(res,dot2(d+(c+b*t.z)*t.z));
    res = Math.min(
      res,
      dotself2(add2(d, scale2(add2(c, scale2(b, t[2])), t[2]))),
    );
    // }
  }
  return Math.sqrt(res);
}

export type BezierQuadratic = {
  a: Vec2;
  b: Vec2;
  c: Vec2;
};

export function gradient2(
  fn: (v: Vec2) => number,
  pos: Vec2,
  diff: number,
): Vec2 {
  const a = fn(pos);
  const b = fn(add2(pos, [diff, 0]));
  const c = fn(add2(pos, [0, diff]));
  return [(a - b) / diff, (a - c) / diff];
}

export function bezierifyFixedCount(
  path: Vec2[],
  count: number,
  learningRate: number,
  gradientDescentIters: number,
) {
  const beziers: BezierQuadratic[] = [];

  for (let i = 0; i < count; i++) {
    const startIndex = Math.floor((i / count) * (path.length - 1));
    const endIndex = Math.floor(((i + 1) / count) * (path.length - 1));

    beziers.push(
      generateBezierApproximation(
        path,
        startIndex,
        endIndex,
        learningRate,
        gradientDescentIters,
      ).bezier,
    );
  }

  return beziers;
}

export function bezierAdaptive(
  path: Vec2[],
  maxError: number,
  learningRate: number,
  gradientDescentIters: number,
): BezierQuadratic[] {
  return bezierAdaptiveInner(
    path,
    maxError,
    0,
    path.length - 1,
    learningRate,
    gradientDescentIters,
  );
}

export function bezierAdaptiveInner(
  path: Vec2[],
  maxError: number,
  startIndex: number,
  endIndex: number,
  learningRate: number,
  gradientDescentIters: number,
): BezierQuadratic[] {
  const approx = generateBezierApproximation(
    path,
    startIndex,
    endIndex,
    learningRate,
    gradientDescentIters,
  );
  if (approx.error <= maxError || endIndex - startIndex < 3)
    return [approx.bezier];
  const mid = Math.floor((startIndex + endIndex) / 2);
  return [
    ...bezierAdaptiveInner(
      path,
      maxError,
      startIndex,
      mid,
      learningRate,
      gradientDescentIters,
    ),
    ...bezierAdaptiveInner(
      path,
      maxError,
      mid,
      endIndex,
      learningRate,
      gradientDescentIters,
    ),
  ];
}

function generateBezierApproximation(
  path: Vec2[],
  startIndex: number,
  endIndex: number,
  learningRate: number,
  gradientDescentIters: number,
): { bezier: BezierQuadratic; error: number } {
  const start = path[startIndex];
  const end = path[endIndex];
  let controlPoint = add2(
    scale2(add2(path[startIndex], path[endIndex]), 0.5),
    [0.0001, 0.0001],
  );

  const getError = (v: Vec2) => {
    let error = 0;
    let count = 0;
    for (let i = startIndex + 1; i < endIndex; i++) {
      error += sdBezier(path[i], start, v, end) ** 2;
      count++;
    }
    return error / count;
  };

  for (let i = 0; i < gradientDescentIters; i++) {
    const gradient = gradient2(getError, controlPoint, 0.001);

    if (isNaN(gradient[0]) || isNaN(gradient[1])) {
      continue;
    }

    controlPoint = add2(controlPoint, scale2(gradient, learningRate));
  }

  return {
    bezier: { a: start, b: controlPoint, c: end },
    error: getError(controlPoint),
  };
}

export function bezierPreview(beziers: BezierQuadratic[], size: number) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;

  const points = beziers.flatMap((e) => [e.a, e.b, e.c]);

  c.width = Math.max(...points.map((b) => b[0])) * size + size;
  c.height = Math.max(...points.map((b) => b[1])) * size + size;

  ctx?.beginPath();
  for (const p of beziers) {
    ctx.moveTo(p.a[0] * size, p.a[1] * size);
    ctx.quadraticCurveTo(
      p.b[0] * size,
      p.b[1] * size,
      p.c[0] * size,
      p.c[1] * size,
    );
  }
  ctx.stroke();
  return c;
}
