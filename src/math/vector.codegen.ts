import * as fs from "node:fs/promises";
import * as prettier from "prettier";
import * as path from "node:path";
import { range, rangeFrom, stringRangeMapJoin } from "../range";
import { cartesianProduct } from "../array-utils";

const paramNames = "abcde";

const swizzleChars = "xyzw".split("");

let swizzles: string[] = genSwizzles(4)
  .concat(genSwizzles(3))
  .concat(genSwizzles(2));

function genSwizzles(length: number): string[] {
  if (length === 0) return [""];
  let shorterSwizzles = genSwizzles(length - 1);
  let swizzles: string[] = [];
  for (const c of swizzleChars) {
    for (const swizzle of shorterSwizzles) {
      swizzles.push(swizzle + c);
    }
  }
  return swizzles;
}

function swizzleIndex(str: string) {
  return str === "x" ? 0 : str === "y" ? 1 : str === "z" ? 2 : 3;
}

function swizzleToFunctions(swizzle: string) {
  let minInputSize = swizzle.includes("w")
    ? 4
    : swizzle.includes("z")
      ? 3
      : swizzle.includes("y")
        ? 2
        : 1;

  let outstr = "";

  let types: string[] = [];
  for (let i = minInputSize; i <= 4; i++) {
    types.push(`Vec${i}`);
  }

  outstr += `export function ${swizzle}(a: ${types.join("|")}): Vec${
    swizzle.length
  } { return [${swizzle
    .split("")
    .map((s) => `a[${swizzleIndex(s)}]`)
    .join(",")}] }`;

  return outstr;
}

function createFunctionVariants(
  basename: string,
  params: ((count: number) => string)[],
  returnType: (count: number) => string,
  opFormat: (index: number) => string,
) {
  let outstr = "";
  for (const size of [2, 3, 4]) {
    outstr += `export function ${basename}${size}(${params
      .map((p, i) => `${paramNames[i]}: ${p(size)}`)
      .join(",")}): ${returnType(size)} { return [${new Array(size)
      .fill(0)
      .map((e, i) => opFormat(i))
      .join(",")}]; }`;
  }
  return outstr;
}

function createFunctionVariantsFullBody(
  basename: string,
  params: ((count: number) => string)[],
  returnType: (count: number) => string,
  body: (index: number) => string,
) {
  let outstr = "";
  for (const size of [2, 3, 4]) {
    outstr += `export function ${basename}${size}(${params
      .map((p, i) => `${paramNames[i]}: ${p(size)}`)
      .join(",")}): ${returnType(size)} { return ${body(size)}; }`;
  }
  return outstr;
}

type CC = 1 | 2 | 3 | 4;

const mat = (a: CC, b: CC) => {
  if (a === 1 || b === 1) return genericVec(Math.max(a, b));
  if (a === b) return `Mat${a}`;
  return `Mat${a}x${b}`;
};

const matDisplay = (a: CC, b: CC) => {
  if (a === 1 || b === 1) return genericVecDisplay(Math.max(a, b));
  if (a === b) return `Mat${a}`;
  return `Mat${a}x${b}`;
};

const genericVec = (i: number) => (i === 1 ? "number" : vec(i));
const genericVecDisplay = (i: number) => (i === 1 ? "Scalar" : vec(i));

const vec = (i: number) => `Vec${i}`;
const num = (i: number) => "number";

let matmuls = new Set<string>();

function columnMajorIndex(dims: [number, number], pos: [number, number]) {
  return pos[1] + pos[0] * dims[1];
}

function genMatmul(a: CC, b: CC, c: CC) {
  let name = "";
  if (a === b && b === c) {
    name = matDisplay(a, a);
  } else {
    name = matDisplay(b, a) + "By" + matDisplay(c, b);
  }

  if (a == 1 && c == 1) return "";
  if (matmuls.has(name)) return "";
  matmuls.add(name);

  return `export function mul${name}(a: ${mat(b, a)}, b: ${mat(c, b)}): ${mat(a, c)} {
    return [
      ${cartesianProduct(range(c), range(a))
        .map(([row, col]) => {
          return range(b)
            .map(
              (i) =>
                `${
                  b === 1 && a === 1
                    ? "a"
                    : `a[${columnMajorIndex([b, a], [i, col])}]`
                } * ${
                  b === 1 && c === 1
                    ? "b"
                    : `b[${columnMajorIndex([c, b], [row, i])}]`
                }`,
            )
            .join("+");
        })
        .join(",")}
    ]
  }`;
}

const vectorLib =
  `
 ${swizzles.map((s) => swizzleToFunctions(s)).join("")}

export function x(a: Vec1 | Vec2 | Vec3 | Vec4): number {
  return a[0];
}
  
export function y(a: Vec2 | Vec3 | Vec4): number {
  return a[1];
}

export function z(a: Vec3 | Vec4): number {
  return a[2];
}

export function w(a:  Vec4): number {
  return a[3];
}

export type Vec1 = [number];
export type Vec2 = [number, number];
export type Vec3 = [number ,number ,number];
export type Vec4 = [number, number, number ,number];

export type Mat2 = [number, number, number, number];
export type Mat3 = [
  ${stringRangeMapJoin(9, () => "number", ",")}
];
export type Mat4 = [
  ${stringRangeMapJoin(16, () => "number", ",")}
];
export type Mat2x3 = [
  ${stringRangeMapJoin(6, () => "number", ",")}
];
export type Mat3x2 = [
  ${stringRangeMapJoin(6, () => "number", ",")}
];
export type Mat4x2 = [
  ${stringRangeMapJoin(8, () => "number", ",")}
];
export type Mat2x4 = [
  ${stringRangeMapJoin(8, () => "number", ",")}
];
export type Mat4x3 = [
  ${stringRangeMapJoin(12, () => "number", ",")}
];
export type Mat3x4 = [
  ${stringRangeMapJoin(12, () => "number", ",")}
];

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function polar2Cart(r: number, theta: number): Vec2 {
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

export function polarVec2Cart(rCommaTheta: Vec2) {
  return polar2Cart(...rCommaTheta);
}

export function cart2Polar(a: Vec2): Vec2 {
  return [length2(a), Math.atan2(a[1], a[0])];
} 

export function pointTo(a: Vec2, b: Vec2): number {
  return Math.atan2(
    b[1] - a[1],
    b[0] - a[0]
  );
} 

export function componentwise2(a: Vec2, f: (x: number) => number): Vec2 {
  return [f(a[0]), f(a[1])];
}
export function componentwise3(a: Vec3, f: (x: number) => number): Vec3 {
  return [f(a[0]), f(a[1]), f(a[2])];
}
export function componentwise4(a: Vec4, f: (x: number) => number): Vec4 {
  return [f(a[0]), f(a[1]), f(a[2]), f(a[3])];
}

${cartesianProduct(
  rangeFrom(1, 5) as (2 | 3 | 4)[],
  rangeFrom(1, 5) as (2 | 3 | 4)[],
  rangeFrom(1, 5) as (2 | 3 | 4)[],
)
  .map(([i, j, k]) => genMatmul(i, j, k))
  .join("\n")}

` +
  createFunctionVariants("add", [vec, vec], vec, (i) => `a[${i}] + b[${i}]`) +
  createFunctionVariants("mul", [vec, vec], vec, (i) => `a[${i}] * b[${i}]`) +
  createFunctionVariants("div", [vec, vec], vec, (i) => `a[${i}] / b[${i}]`) +
  createFunctionVariants("sub", [vec, vec], vec, (i) => `a[${i}] - b[${i}]`) +
  createFunctionVariants(
    "min",
    [vec, vec],
    vec,
    (i) => `Math.min(a[${i}], b[${i}])`,
  ) +
  createFunctionVariants(
    "max",
    [vec, vec],
    vec,
    (i) => `Math.max(a[${i}], b[${i}])`,
  ) +
  createFunctionVariants("neg", [vec], vec, (i) => `-a[${i}]`) +
  createFunctionVariantsFullBody(
    "normalize",
    [vec],
    vec,
    (i) => `scale${i}(a, 1 / Math.sqrt(dot${i}(a, a)))`,
  ) +
  createFunctionVariantsFullBody(
    "length",
    [vec],
    num,
    (i) => `Math.sqrt(dot${i}(a, a))`,
  ) +
  createFunctionVariantsFullBody(
    "distance",
    [vec, vec],
    num,
    (i) => `length${i}(sub${i}(a, b))`,
  ) +
  createFunctionVariantsFullBody(
    "mix",
    [num, vec, vec],
    vec,
    (i) => `add${i}(b, scale${i}(sub${i}(c, b), a))`,
  ) +
  createFunctionVariantsFullBody(
    "rescale",
    [vec, num],
    vec,
    (i) => `scale${i}(normalize${i}(a), b)`,
  ) +
  createFunctionVariantsFullBody(
    "remap",
    [vec, vec, vec, vec, vec],
    vec,
    (i) =>
      `add${i}(d, mul${i}(sub${i}(e, d), div${i}(sub${i}(a, b), sub${i}(c, b))))`,
  ) +
  createFunctionVariantsFullBody(
    "interp",
    [vec, vec, vec, (i) => `(x: number) => number`],
    vec,
    (i) => `add${i}(b, mul${i}(sub${i}(c, b), componentwise${i}(a, d)))`,
  ) +
  createFunctionVariantsFullBody("sum", [vec], num, (i) =>
    i == 4
      ? "a[0] + a[1] + a[2] + a[3]"
      : i == 3
        ? "a[0] + a[1] + a[2]"
        : "a[0] + a[1]",
  ) +
  createFunctionVariantsFullBody(
    "dot",
    [vec, vec],
    num,
    (i) => `sum${i}(mul${i}(a, b))`,
  ) +
  createFunctionVariants("scale", [vec, num], vec, (i) => `a[${i}] * b`);
await fs.writeFile(
  path.join(__dirname, "vector.generated.ts"),
  await prettier.format(vectorLib, { parser: "typescript", semi: false }),
);
