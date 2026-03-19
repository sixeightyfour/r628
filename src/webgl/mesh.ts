import {
  add3,
  cross,
  dot3,
  Mat4,
  scale3,
  Vec2,
  Vec3,
  Vec4,
} from "../math/vector.generated";

type MeshAttrs = Record<string, [number] | Vec2 | Vec3 | Vec4>;

type Mesh<T extends MeshAttrs> = T[];

export function parametric2D<T extends string>(
  x: number,
  y: number,
  attr: T,
  getPoint: (i: number, y: number) => Vec3,
): Mesh<{ [K in T]: Vec3 }> {
  const data: Mesh<{ [K in T]: Vec3 }> = [];
  for (let j = 0; j < y; j++) {
    for (let i = 0; i < x; i++) {
      const a = getPoint(i, j);
      const b = getPoint(i + 1, j);
      const c = getPoint(i, j + 1);
      const d = getPoint(i + 1, j + 1);
      // @ts-expect-error
      data.push({ [attr]: a });
      // @ts-expect-error
      data.push({ [attr]: c });
      // @ts-expect-error
      data.push({ [attr]: b });
      // @ts-expect-error
      data.push({ [attr]: c });
      // @ts-expect-error
      data.push({ [attr]: d });
      // @ts-expect-error
      data.push({ [attr]: b });
    }
  }
  return data;
}

export function uvSphere<T extends string>(
  x: number,
  y: number,
  rad: number,
  attr: T,
): Mesh<{ [K in T]: Vec3 }> {
  return parametric2D<T>(x, y, attr, (i, j) => {
    const a = (((i + x) % x) / x) * Math.PI * 2;
    const b = (((j + y) % y) / y) * Math.PI - Math.PI / 2;

    let px = Math.cos(a) * Math.cos(b) * rad;
    let pz = Math.sin(a) * Math.cos(b) * rad;
    let py = Math.sin(b) * rad;
    return [px, py, pz];
  });
}

export function ring<T extends string>(
  x: number,
  rad: number,
  height: number,
  attr: T,
): Mesh<{ [K in T]: Vec3 }> {
  return parametric2D<T>(x, 1, attr, (i, j) => {
    const a = (((i + x) % x) / x) * Math.PI * 2;
    const px = Math.cos(a) * rad;
    const pz = Math.sin(a) * rad;
    const py = j === 1 ? height / 2 : -height / 2;
    return [px, py, pz];
  });
}

export function torus<T extends string>(
  x: number,
  y: number,
  R: number,
  r: number,
  attr: T,
): Mesh<{ [K in T]: Vec3 }> {
  return parametric2D<T>(x, y, attr, (i, j) => {
    const a = (((i + x) % x) / x) * Math.PI * 2;
    const b = (((j + y) % y) / y) * Math.PI * 2;
    let px = Math.cos(a);
    let pz = Math.sin(a);
    let py = Math.sin(b) * r;
    px *= R + Math.cos(b) * r;
    pz *= R + Math.cos(b) * r;
    return [px, py, pz];
  });
}

export function move<T extends MeshAttrs>(
  mesh: Mesh<T>,
  attr: keyof T,
  offset: number[],
): Mesh<T> {
  return mesh.map((m) => ({
    ...m,
    [attr]: m[attr].map((e, i) => e + offset[i]),
  }));
}

export function perspective(
  fieldOfViewInRadians: number,
  aspectRatio: number,
  near: number,
  far: number,
): Mat4 {
  const f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
  const rangeInv = 1 / (near - far);

  return [
    f / aspectRatio,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (near + far) * rangeInv,
    -1,
    0,
    0,
    near * far * rangeInv * 2,
    0,
  ];
}

export function ortho(
  left: number,
  right: number,
  top: number,
  bottom: number,
  near: number,
  far: number,
): Mat4 {
  return [
    2 / (right - left),
    0,
    0,
    -(right + left) / (right - left),
    0,
    2 / (top - bottom),
    0,
    -(top + bottom) / (top - bottom),
    0,
    0,
    -2 / (far - near),
    -(far + near) / (far - near),
    0,
    0,
    0,
    1,
  ];
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(...v);
  return scale3(v, 1 / len);
}

export function rodrigues(v: Vec3, k: Vec3, theta: number): Vec3 {
  k = normalize(k);
  return add3(
    add3(scale3(v, Math.cos(theta)), scale3(cross(k, v), Math.sin(theta))),
    scale3(k, dot3(k, v) * (1 - Math.cos(theta))),
  );
}

export function rotate(axis: Vec3, angle: number): Mat4 {
  return [
    ...rodrigues([1, 0, 0], axis, angle),
    0,
    ...rodrigues([0, 1, 0], axis, angle),
    0,
    ...rodrigues([0, 0, 1], axis, angle),
    0,
    0,
    0,
    0,
    1,
  ];
}

export function scale(axes: Vec3): Mat4 {
  return [axes[0], 0, 0, 0, 0, axes[1], 0, 0, 0, 0, axes[2], 0, 0, 0, 0, 1];
}

export function translate(v: Vec3): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ...v, 1];
}
