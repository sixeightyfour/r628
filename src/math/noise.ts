import { lerp, smoothstep } from "../interpolation";
import { add2, dot2, normalize2, sub2, Vec2 } from "./vector.generated";

function fract(x: number): number {
  return x - Math.floor(x);
}

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
export function simpleRandVec2ToFloat(co: Vec2): number {
  return fract(Math.sin(dot2(co, [12.9898, 78.233])) * 43758.5453);
}

export function simpleRandVec2ToVec2(co: Vec2): Vec2 {
  return [simpleRandVec2ToFloat(co), simpleRandVec2ToFloat([-co[0], -co[1]])];
}

export function perlin2d(
  p: Vec2,
  randVec2: (pos: Vec2) => Vec2 = simpleRandVec2ToVec2,
) {
  const fp: Vec2 = [Math.floor(p[0]), Math.floor(p[1])];

  const v1 = normalize2(sub2(randVec2(fp), [0.5, 0.5]));
  const v2 = normalize2(sub2(randVec2(add2(fp, [1, 0])), [0.5, 0.5]));
  const v3 = normalize2(sub2(randVec2(add2(fp, [0, 1])), [0.5, 0.5]));
  const v4 = normalize2(sub2(randVec2(add2(fp, [1, 1])), [0.5, 0.5]));

  const o1 = sub2(p, fp);
  const o2 = sub2(o1, [1, 0]);
  const o3 = sub2(o1, [0, 1]);
  const o4 = sub2(o1, [1, 1]);

  const d1 = dot2(v1, o1);
  const d2 = dot2(v2, o2);
  const d3 = dot2(v3, o3);
  const d4 = dot2(v4, o4);

  const h1 = lerp(smoothstep(p[0] - fp[0]), d1, d2);
  const h2 = lerp(smoothstep(p[0] - fp[0]), d3, d4);

  return lerp(smoothstep(p[1] - fp[1]), h1, h2);
}

export function boxMullerTransform(u: Vec2) {
  const a = Math.sqrt(-2 * Math.log(u[0]));
  const b = 2 * Math.PI * u[1];

  return [a * Math.cos(b), a * Math.sin(b)];
}
