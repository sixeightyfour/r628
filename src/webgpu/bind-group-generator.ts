import {
  Mat2,
  Mat2x3,
  Mat2x4,
  Mat3,
  Mat3x2,
  Mat3x4,
  Mat4,
  Mat4x2,
  Mat4x3,
  Vec2,
  Vec3,
  Vec4,
} from "../math/vector.generated";

type FromEntries<Entries extends [string | symbol | number, any][]> =
  Entries extends [
    infer Head extends [string | number | symbol, any],
    ...infer Tail extends [string | number | symbol, any][],
  ]
    ? { [K in Head[0]]: Head[1] } & FromEntries<Tail>
    : {};

type Test = FromEntries<[["a", 1], ["b", 2]]>;

type ParseUniformPrimitive<T extends string> = T extends `mat2x2${string}`
  ? Mat2
  : T extends `mat3x3${string}`
    ? Mat3
    : T extends `mat4x4${string}`
      ? Mat4
      : T extends `mat3x4${string}`
        ? Mat3x4
        : T extends `mat4x3${string}`
          ? Mat4x3
          : T extends `mat2x4${string}`
            ? Mat2x4
            : T extends `mat4x2${string}`
              ? Mat4x2
              : T extends `mat2x3${string}`
                ? Mat2x3
                : T extends `mat3x2${string}`
                  ? Mat3x2
                  : T extends `mat2${string}`
                    ? Mat2
                    : T extends `mat3${string}`
                      ? Mat3
                      : T extends `mat4${string}`
                        ? Mat4
                        : T extends `vec4${string}`
                          ? Vec4
                          : T extends `vec3${string}`
                            ? Vec3
                            : T extends `vec2${string}`
                              ? Vec2
                              : number;

type StaticArray<I extends number, T> = I extends 0
  ? []
  : I extends 1
    ? [T]
    : I extends 2
      ? [T, T]
      : I extends 3
        ? [T, T, T]
        : I extends 4
          ? [T, T, T, T]
          : I extends 5
            ? [T, T, T, T, T]
            : I extends 6
              ? [T, T, T, T, T, T]
              : I extends 7
                ? [T, T, T, T, T, T, T]
                : T[];

// type ParseUniformStructMembers<
//   T extends { name: string; type: Record<any, any> }[]
// > = T extends [
//   infer Head extends { name: string; type: Record<any, any> },
//   ...infer Tail extends { name: string; type: Record<any, any> }[]
// ]
//   ? [
//       [Head["name"], ParseUniform<Head["type"]>],
//       ...ParseUniformStructMembers<Tail>
//     ]
//   : [];

type FormatName = "f32" | "i32" | "u32" | "f16";

function getWgslPrimitiveDatatype(
  typename: string,
  formatname: FormatName | undefined,
): FormatName {
  // handle vec2<f32> and stuff like that
  if (formatname) return formatname;

  // scalar types
  if (
    typename === "f32" ||
    typename === "i32" ||
    typename === "u32" ||
    typename === "f16"
  )
    return typename;

  // vectors
  if (typename.startsWith("vec") || typename.startsWith("mat")) {
    if (typename.endsWith("i")) {
      return "i32";
    } else if (typename.endsWith("u")) {
      return "u32";
    } else if (typename.endsWith("h")) {
      return "f16";
    }
  }

  // default to f32
  return "f32";
}

function getWgslPrimitiveSize(typename: string) {
  if (typename.startsWith("vec2")) return 2;
  if (typename.startsWith("vec3")) return 3;
  if (typename.startsWith("vec4")) return 4;

  if (typename.startsWith("mat2x3")) return 6;
  if (typename.startsWith("mat3x2")) return 6;

  if (typename.startsWith("mat2x4")) return 8;
  if (typename.startsWith("mat4x2")) return 8;

  if (typename.startsWith("mat3x4")) return 12;
  if (typename.startsWith("mat4x3")) return 12;

  if (typename.startsWith("mat2")) return 4;
  if (typename.startsWith("mat3")) return 9;
  if (typename.startsWith("mat4")) return 16;

  return 1;
}

function setWgslPrimitive(
  typename: string,
  formatname: string | undefined,
  view: DataView,
  offset: number,
  data: number[],
) {
  const datatype = getWgslPrimitiveDatatype(typename, formatname as FormatName);
  const size = getWgslPrimitiveSize(typename);

  let stride = {
    i32: 4,
    f32: 4,
    u32: 4,
    f16: 2,
  }[datatype] as number;

  let method = {
    i32: "setInt32",
    f32: "setFloat32",
    u32: "setUint32",
    f16: "setFloat16",
  }[datatype] as "setInt32" | "setFloat32" | "setUint32" | "setFloat16";

  for (let i = 0; i < size; i++) {
    view[method](offset + stride * i, data[i], true);
  }
}

type FromUniformStructEntries<
  Entries extends { name: string; type: Record<any, any> }[],
> = Entries extends [
  infer Head extends { name: string; type: Record<any, any> },
  ...infer Tail extends { name: string; type: Record<any, any> }[],
]
  ? {
      [K in Head["name"]]: ParseUniform<Head["type"]>;
    } & FromUniformStructEntries<Tail>
  : {};

type ParseUniform<T extends Record<any, any>> = T["members"] extends {
  name: string;
  type: Record<any, any>;
}[]
  ? FromUniformStructEntries<T["members"]>
  : T["name"] extends string
    ? T["name"] extends "array"
      ? StaticArray<T["count"], ParseUniform<T["format"]>>
      : ParseUniformPrimitive<T["name"]>
    : never;

function generateUniformBufferInner<Spec extends Record<any, any>>(
  spec: Spec,
  values: any,
  view: DataView,
  offset: number,
) {
  if (spec.members) {
    for (const m of spec.members)
      generateUniformBufferInner(
        m.type,
        values[m.name],
        view,
        offset + m.offset,
      );
    return;
  }

  const typename = spec.name as string;

  if (typename === "array") {
    for (let i = 0; i < spec.count; i++) {
      generateUniformBufferInner(
        spec.format,
        values[i],
        view,
        offset + spec.stride * i,
      );
    }
  } else {
    setWgslPrimitive(
      spec.name,
      spec.format?.name,
      view,
      offset,
      Array.isArray(values) ? values : [values],
    );
  }
}

export function generateUniformBuffer<Spec extends Record<any, any>>(
  spec: Spec & { size: number },
  values: ParseUniform<Spec>,
  buffer?: ArrayBuffer,
  byteOffset?: number,
): ArrayBuffer {
  const buf = buffer ?? new ArrayBuffer(spec.size);
  const view = new DataView(buf, byteOffset);
  generateUniformBufferInner<Spec>(spec, values, view, 0);
  return buf;
}

export function getUniformBufferSize<
  Spec extends Record<any, any>,
  Group extends number,
  Binding extends number,
>(
  spec: Spec,
  group: Group,
  binding: Binding,
): Spec["bindGroups"][Group][Binding]["type"]["size"] {
  return spec.bindGroups[group][binding].type.size;
}

export function makeUniformBuffer<
  Spec extends Record<any, any>,
  Group extends number,
  Binding extends number,
>(
  spec: Spec,
  group: Group,
  binding: Binding,
  data: ParseUniform<Spec["bindGroups"][Group][Binding]["type"]>,
  buffer?: ArrayBuffer,
  byteOffset?: number,
) {
  return generateUniformBuffer(
    spec.bindGroups[group][binding].type,
    data,
    buffer,
    byteOffset,
  );
}
