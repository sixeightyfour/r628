import {
  AllEq,
  Eq,
  FromEntries,
  OneLayerFlatten,
  TypeLevelError,
  ListAppend,
  LinkedList,
  ListTail,
  ToKvPairs,
} from "../typelevel";
import {
  TEXTURE_FORMAT_TO_WGSL_TYPE_LUT,
  VERTEX_FORMAT_TO_JS_TYPE,
  VERTEX_FORMAT_TO_TYPEDARRAY_TYPE,
  TEXTURE_FORMAT_TO_SAMPLER_TYPE_LUT,
  vertexFormatStride,
  AllowedTextureFormats,
  vertexFormatToWgslType,
  VERTEX_FORMAT_TO_ELEMENT_COUNT,
  VERTEX_FORMAT_TO_ELEMENT_SIZE,
  VERTEX_FORMAT_TO_TYPEDARRAY_CONSTRUCTOR,
} from "./converters";
import {
  createLayoutGenerator,
  createWgslSerializers,
  generateLayouts,
  typeName,
  WGSLStructSpec,
  WGSLStructValues,
} from "./wgsl-struct-layout-generator";
import { Vec2, Vec3 } from "../math/vector.generated";
import { arrayToObjEntries, arrayToObjValues } from "../object-utils";

type WrappedBindGroupTexture<
  Format extends GPUTextureFormat,
  ViewDimension extends GPUTextureViewDimension,
  Multisampled extends boolean,
> = {
  format: Format;
  name: string;
  type: "texture";
  multisampled: Multisampled;
  viewDimension: ViewDimension;
  visibility: number;
  // instantiate<
  //   Fmt extends AllowedTextureFormats<SampleType>,
  //   Dim extends "1d" | "2d" | "3d",
  // >(
  //   format: Fmt,
  //   dimensionality: Dim
  // ): GPUTexture & {
  //   format: Fmt;
  //   dimensionality: Dim;
  //   sampleType: SampleType;
  // };
};

type WrappedBindGroupSampler = {
  type: "comparison" | "filtering" | "non-filtering";
};

type WrappedBindGroupUniformBuffer<Spec extends WGSLStructSpec> = {
  type: "uniform-buffer" | "storage-buffer";
  name: string;
  format: Spec;
  visibility: number;
  withName<Name2 extends string>(
    name2: Name2,
  ): WrappedBindGroupUniformBuffer<Spec> & { name: Name2 };
  instantiate(count: number): GPUBuffer & {
    format: {
      type: "uniform";
      data: Spec;
    };
  };
  fill: (buf: GPUBuffer, offset: number, data: WGSLStructValues<Spec>) => void;
  wgsl: (groupIndex: number, bindingIndex: number) => string;
  wgslStorage: (
    groupIndex: number,
    bindingIndex: number,
    access: "read" | "write" | "read_write",
  ) => string;
  quickCreate(data: WGSLStructValues<Spec>): GPUBuffer & {
    format: {
      type: "uniform";
      data: Spec;
    };
  };
  quickCreateMany(data: WGSLStructValues<Spec>[]): GPUBuffer & {
    format: {
      type: "uniform";
      data: Spec;
    };
  };
  reinterpret: (buf: GPUBuffer) => GPUBuffer & {
    format: {
      type: "uniform";
      data: Spec;
    };
  };
};

export type Attribute = {
  format: GPUVertexFormat;
  offset: number;
  name: string;
};

export type WrappedBindGroupVertexBufferGeneric = WrappedBindGroupVertexBuffer<
  string,
  number,
  Attribute[],
  GPUVertexStepMode
>;

export type WrappedBindGroupVertexBuffer<
  Name extends string,
  ArrayStride extends number,
  Attrs extends Attribute[],
  StepMode extends GPUVertexStepMode,
> = {
  type: "vertex-buffer";
  name: Name;
  arrayStride: ArrayStride;
  stepMode: StepMode;
  attributes: Attrs;
  quickCreate(
    data: FromEntries<{
      [N in keyof Attrs]: [
        Attrs[N]["name"],
        VERTEX_FORMAT_TO_JS_TYPE[Attrs[N]["format"]],
      ];
    }>[],
    descriptor?: Partial<GPUBufferDescriptor>,
  ): GPUBuffer & {
    format: {
      type: "vertex";
      data: {
        arrayStride: ArrayStride;
        attributes: Attrs;
        stepMode: StepMode;
      };
    };
  };
  instantiate(
    count: number,
    descriptor?: Partial<GPUBufferDescriptor>,
  ): GPUBuffer & {
    format: {
      type: "vertex";
      data: {
        arrayStride: ArrayStride;
        attributes: Attrs;
        stepMode: StepMode;
      };
    };
  };
  interleave(
    src: FromEntries<{
      [N in keyof Attrs]: [
        Attrs[N]["name"],
        VERTEX_FORMAT_TO_TYPEDARRAY_TYPE[Attrs[N]["format"]],
      ];
    }>,
    dst?: ArrayBuffer,
    offset?: number,
  ): ArrayBuffer;
  parametric(fn: (i: number) => VBufferParametric<Attrs>);
  reinterpret: (buf: GPUBuffer) => GPUBuffer & {
    format: {
      type: "vertex";
      data: {
        arrayStride: ArrayStride;
        attributes: Attrs;
      };
    };
  };
  wgslStorage: (
    groupIndex: number,
    bindingIndex: number,
    access: "read" | "write" | "read_write",
  ) => string;
  visibility: number;
  readonly: boolean;
};

type WrappedBuffer<
  ArrayStride extends number,
  Attrs extends Attribute[],
> = GPUBuffer & {
  format:
    | {
        type: "vertex";
        data: {
          arrayStride: ArrayStride;
          attributes: Attrs;
        };
      }
    | {
        type: "uniform";
        data: WGSLStructSpec;
      };
};

type WrappedBufferGeneric = WrappedBuffer<number, Attribute[]>;

type WrappedTexture<Fmt extends GPUTextureFormat> = GPUTexture & {
  format: Fmt;
  sampleType: (typeof TEXTURE_FORMAT_TO_SAMPLER_TYPE_LUT)[Fmt];
  dimensionality: "1d" | "2d" | "3d";
};

type WrappedPipeline<
  BindGroups extends (WrappedBindGroupLayoutGeneric | undefined)[],
  Shader extends WrappedShader,
  Inputs extends WrappedBindGroupVertexBuffer<
    string,
    number,
    Attribute[],
    GPUVertexStepMode
  >[],
  Outputs extends Record<string, OutputFormat>,
> = GPURenderPipeline & {
  bindGroups: BindGroups;
  shader: Shader;
  inputs: Inputs;
  outputs: Outputs;
};

type WrappedCompute<
  BindGroups extends (WrappedBindGroupLayoutGeneric | undefined)[],
  Shader extends WrappedShader,
> = GPUComputePipeline & {
  bindGroups: BindGroups;
  shader: Shader;
};

type WrappedRenderPass = {};

type WrappedBindGroup = GPUBindGroup & {
  entries: WrappedBindGroupEntry[];
};

type VertexFormatsToBuffers<Buffers> =
  Buffers extends Record<
    string,
    WrappedBindGroupVertexBuffer<string, number, Attribute[], GPUVertexStepMode>
  >
    ? {
        [K in keyof Buffers]:
          | WrappedBuffer<Buffers[K]["arrayStride"], Buffers[K]["attributes"]>
          | [
              WrappedBuffer<
                Buffers[K]["arrayStride"],
                Buffers[K]["attributes"]
              >,
              number,
            ];
      }
    : never;

type BindGroupFormatsToBindGroups<Groups> =
  Groups extends Record<string, WrappedBindGroupLayoutGeneric>
    ? {
        [K in keyof Groups]: GPUBindGroup & {
          entries: Groups[K]["entries"];
        };
      }
    : never;

type WrappedPipelineBindings<
  BindGroups extends (WrappedBindGroupLayoutGeneric | undefined)[],
  Inputs extends WrappedBindGroupVertexBuffer<
    string,
    number,
    Attribute[],
    GPUVertexStepMode
  >[],
> =
  | VertexFormatsToBuffers<FromEntries<ToKvPairs<Inputs, "name">>>
  | BindGroupFormatsToBindGroups<FromEntries<ToKvPairs<BindGroups, "name">>>;

// type SODJFH = WrappedPipelineBindings<
//   [
//     {
//       name: "perObject";
//       entries: [
//         {
//           type: "uniform-buffer";
//           name: "uniforms";
//           format: {
//             type: "struct";
//             name: "PerObjectUniforms";
//             members: {
//               mvp: { type: { type: "mat4x4f" } };
//             };
//           };
//         },
//       ];
//     },
//   ],
//   [
//     {
//       type: "vertex-buffer";
//       name: "position";
//       arrayStride: 12;
//       attributes: [];
//     } & WrappedBindGroupVertexBuffer<12, []>,
//   ]
// >;

type WrappedPipelineGeneric = WrappedPipeline<
  (WrappedBindGroupLayoutGeneric | undefined)[],
  WrappedShader,
  WrappedBindGroupVertexBuffer<
    string,
    number,
    Attribute[],
    GPUVertexStepMode
  >[],
  Record<string, OutputFormat>
>;

type WithKeys<A, B> = Omit<A, keyof B> & B;

type RenderPassEncoderDrawErrors<Errs> = {
  draw: Errs;
  drawIndexed: Errs;
  drawIndexedIndirect: Errs;
  drawIndirect: Errs;
};

type EqOrError<A, B, Err> = Eq<A, B> extends true ? [] : [Err];

type AllEqOrError<As extends any[], Bs extends any[], Err> =
  AllEq<As, Bs> extends true ? [] : [Err];

type VBufferParametric<A extends Attribute[]> = FromEntries<{
  [N in keyof A]: [A[N]["name"], VERTEX_FORMAT_TO_JS_TYPE[A[N]["format"]]];
}>;

export type WrappedBindGroupEntry =
  | WrappedBindGroupTexture<any, any, any>
  | WrappedBindGroupUniformBuffer<WGSLStructSpec>
  | WrappedBindGroupVertexBuffer<
      string,
      number,
      Attribute[],
      GPUVertexStepMode
    >;

type BindGroupEntryToBindGroup<Entry extends WrappedBindGroupEntry> =
  Entry extends WrappedBindGroupUniformBuffer<infer Format>
    ? GPUBuffer & {
        format: { type: "uniform"; data: Format };
      }
    : Entry extends WrappedBindGroupVertexBuffer<
          infer Name,
          infer ArrayStride,
          infer Attributes,
          infer StepMode
        >
      ? GPUBuffer & {
          format: {
            type: "vertex";
            data: {
              arrayStride: ArrayStride;
              attributes: Attributes;
              stepMode: StepMode;
            };
          };
        }
      : Entry extends WrappedBindGroupTexture<
            infer SampleType,
            infer ViewDimension,
            infer Multisampled
          >
        ? GPUTexture & {
            sampleType: SampleType;
          }
        : never;

export type BindGroupEntriesToBindGroups<Entries> =
  Entries extends Record<string, WrappedBindGroupEntry>
    ? {
        [K in keyof Entries]: BindGroupEntryToBindGroup<Entries[K]>;
      }
    : never;

type WrappedBindGroupLayout<Entries extends WrappedBindGroupEntry[]> =
  GPUBindGroupLayout & {
    name: string;
    entries: Entries;
    instantiate(
      params: BindGroupEntriesToBindGroups<
        FromEntries<ToKvPairs<Entries, "name">>
      >,
    ): GPUBindGroup & {
      entries: Entries;
    };
  };

export type WrappedBindGroupLayoutGeneric = WrappedBindGroupLayout<
  WrappedBindGroupEntry[]
>;

type WrappedShader = {
  module: GPUShaderModule;
  stages: ShaderStage[];
};

type ShaderStage = "compute" | "vertex" | "fragment";

type ConvertArray<Arr extends any[], Dst> = Arr extends [
  infer First,
  ...infer Rest,
]
  ? [Dst, ...ConvertArray<Rest, Dst>]
  : [];

type ConvertArrayByObjectKeys<
  Arr extends any[],
  SrcKey extends keyof Arr[number],
  DstObj,
> = Arr extends [infer First extends Arr[number], ...infer Rest]
  ? [DstObj[First[SrcKey]], ...ConvertArrayByObjectKeys<Rest, SrcKey, DstObj>]
  : [];

type TypesToAttrs<Types extends [string, GPUVertexFormat][]> = Types extends [
  [infer Name, infer Fmt],
  ...infer Rest extends [string, GPUVertexFormat][],
]
  ? [
      {
        name: Name;
        fmt: Fmt;
        offset: number;
      },
      ...TypesToAttrs<Rest>,
    ]
  : [];

export type OutputFormat =
  | GPUTextureFormat
  | GPUColorTargetState
  | WrappedBindGroupTexture<any, any, any>;

export function pipelineRenderpass<Pipeline extends WrappedPipelineGeneric>(
  pipeline: Pipeline,
  pass: GPURenderPassEncoder | GPURenderBundleEncoder,
): (
  bindings: Partial<
    WrappedPipelineBindings<Pipeline["bindGroups"], Pipeline["inputs"]>
  >,
) => void {
  const bindGroupNameToIndex = new Map(
    pipeline.bindGroups.map((b, i) => [b.name, i]),
  );
  const inputNameToIndex = new Map(pipeline.inputs.map((b, i) => [b.name, i]));

  return (bindings) => {
    for (const [k, v] of Object.entries(bindings)) {
      const bindGroupIndex = bindGroupNameToIndex.get(k);
      if (bindGroupIndex !== undefined) {
        pass.setBindGroup(bindGroupIndex, v as GPUBindGroup);
        continue;
      }

      const inputIndex = inputNameToIndex.get(k);
      if (inputIndex !== undefined) {
        pass.setVertexBuffer(
          inputIndex,
          // @ts-expect-error
          ...(Array.isArray(v) ? v : [v as GPUBuffer]),
        );
        continue;
      }

      throw new Error(`Bound pipeline does not have attribute '${k}'.`);
    }
  };
}

export function wrapDevice(device: GPUDevice) {
  const wdevice = {
    storageBuffer<Name extends string, Spec extends WGSLStructSpec>(
      name: Name,
      spec: Spec,
      settings?: {
        visibility?: GPUShaderStageFlags;
        usage?: GPUBufferUsageFlags;
        arrayify?: boolean;
      },
    ) {
      return wdevice.uniformBuffer<Name, Spec>(name, spec, true, {
        visibility: GPUShaderStage.COMPUTE,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_SRC |
          GPUBufferUsage.COPY_DST,
        ...settings,
      });
    },
    uniformBufferForComputeShader<
      Name extends string,
      Spec extends WGSLStructSpec,
    >(name: Name, spec: Spec) {
      return wdevice.uniformBuffer<Name, Spec>(name, spec, false, {
        visibility: GPUShaderStage.COMPUTE,
      });
    },
    uniformBuffer<Name extends string, Spec extends WGSLStructSpec>(
      name: Name,
      spec: Spec,
      isStorage?: boolean,
      settings?: {
        visibility?: GPUShaderStageFlags;
        usage?: GPUBufferUsageFlags;
        arrayify?: boolean;
      },
    ): WrappedBindGroupUniformBuffer<Spec> & { name: Name } {
      const [withLayouts] = generateLayouts([spec]);
      const gen = createLayoutGenerator(withLayouts);

      return {
        withName<Name2 extends string>(name2: Name2) {
          return wdevice.uniformBuffer(name2, spec, isStorage, settings);
        },
        type: isStorage ? "storage-buffer" : ("uniform-buffer" as const),
        name,
        format: spec,
        visibility:
          settings?.visibility ??
          GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        quickCreate(data: WGSLStructValues<Spec>) {
          const gpubuf = this.instantiate(1);
          const arrayBuf = new ArrayBuffer(withLayouts.size);
          gen(new DataView(arrayBuf), data);
          device.queue.writeBuffer(gpubuf, 0, arrayBuf);
          return gpubuf;
        },
        quickCreateMany(data: WGSLStructValues<Spec>[]) {
          const gpubuf = this.instantiate(data.length);
          const arrayBuf = new ArrayBuffer(withLayouts.size * data.length);
          for (let i = 0; i < data.length; i++)
            gen(new DataView(arrayBuf, i * withLayouts.size), data[i]);
          device.queue.writeBuffer(gpubuf, 0, arrayBuf);
          return gpubuf;
        },
        instantiate(count: number): GPUBuffer & {
          format: {
            type: "uniform";
            data: Spec;
          };
        } {
          const buf = device.createBuffer({
            usage:
              settings?.usage ??
              GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            size: withLayouts.size * count,
          });

          // @ts-expect-error
          buf.format = {
            type: "uniform",
            data: spec,
          };

          // @ts-expect-error
          return buf;
        },
        fill(buf: GPUBuffer, offset: number, data: WGSLStructValues<Spec>) {
          const cpubuf = new ArrayBuffer(withLayouts.size);
          gen(new DataView(cpubuf), data);
          device.queue.writeBuffer(buf, offset, cpubuf);
        },
        wgsl(groupIndex: number, bindingIndex: number): string {
          return `@group(${groupIndex}) @binding(${bindingIndex}) var<uniform> ${name} : ${typeName(spec)};`;
        },
        wgslStorage(
          groupIndex: number,
          bindingIndex: number,
          access: "read" | "write" | "read_write",
        ): string {
          return `@group(${groupIndex}) @binding(${bindingIndex}) var<storage, ${access}> ${name} : ${(settings.arrayify ?? true) ? `array<${typeName(spec)}>;` : typeName(spec) + ";"}`;
        },
        // @ts-expect-error
        reinterpret(buf: GPUBuffer) {
          return buf;
        },
      };
    },
    vertexBuffer<
      Name extends string,
      ArrayStride extends number,
      Types extends Attribute[],
      StepMode extends GPUVertexStepMode,
    >(
      name: Name,
      params: {
        stride: ArrayStride;
        types: Types;
        stepMode: StepMode;
        visibility: number;
      },
    ): WrappedBindGroupVertexBuffer<Name, ArrayStride, Types, StepMode> {
      let size = params.stride;

      // let attributes: {
      //   format: GPUVertexFormat;
      //   offset: number;
      //   name: string;
      // }[] = [];

      // for (const [name, format] of types) {
      //   const stride = vertexFormatStride(format);

      //   attributes.push({
      //     format,
      //     name,
      //     offset: size,
      //   });

      //   size += stride;
      // }

      return {
        visibility: params.visibility,
        name,
        stepMode: params.stepMode,
        type: "vertex-buffer",
        arrayStride: size,
        attributes: params.types,
        // @ts-expect-error
        reinterpret(buf) {
          return buf;
        },
        // @ts-expect-error
        instantiate(count, descriptor) {
          const buf = device.createBuffer({
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            size: count * size,
            ...descriptor,
          });
          return buf;
        },
        quickCreate(data, descriptor) {
          const buf = this.instantiate(data.length, descriptor);
          const cpubuf = new ArrayBuffer(size * data.length);
          const attrViews = arrayToObjEntries(params.types, (attr) => [
            attr.name,
            new VERTEX_FORMAT_TO_TYPEDARRAY_CONSTRUCTOR[attr.format](cpubuf),
          ]);

          let index = 0;
          for (const d of data) {
            for (const a of params.types) {
              const view = attrViews[a.name];
              const elementSize = VERTEX_FORMAT_TO_ELEMENT_SIZE[a.format];
              const elementCount = VERTEX_FORMAT_TO_ELEMENT_COUNT[a.format];
              for (let i = 0; i < elementCount; i++) {
                const byteOffset = index * size + a.offset;
                const elementOffset = byteOffset / elementSize + i;
                view[elementOffset] =
                  elementCount === 1 ? d[a.name] : d[a.name][i];
              }
            }
            index++;
          }

          device.queue.writeBuffer(buf, 0, cpubuf);
          return buf;
        },
      };
    },
    bindGroup<Name extends string, Entries extends WrappedBindGroupEntry[]>(
      name: Name,
      ...entries: Entries
    ): GPUBindGroupLayout & {
      entries: Entries;
      name: Name;
      instantiate(
        params: BindGroupEntriesToBindGroups<
          FromEntries<ToKvPairs<Entries, "name">>
        >,
      ): GPUBindGroup & {
        entries: Entries;
      };
    } {
      const layout = device.createBindGroupLayout({
        entries: entries.map((e, i) => {
          if (e.type === "texture") {
            return {
              binding: i,
              visibility: e.visibility,
              layout: {
                texture: {
                  sampleType: TEXTURE_FORMAT_TO_SAMPLER_TYPE_LUT[e.format],
                  multisampled: e.multisampled,
                  viewDimension: e.viewDimension,
                },
              },
            };
          } else if (
            e.type === "uniform-buffer" ||
            e.type === "storage-buffer"
          ) {
            return {
              binding: i,
              visibility: e.visibility,
              buffer: {
                type: e.type === "storage-buffer" ? "storage" : "uniform",
              },
            };
          } else if (e.type === "vertex-buffer") {
            return {
              binding: i,
              visibility: e.visibility,
              buffer: {
                type: e.readonly ? "read-only-storage" : "storage",
              },
            };
          }
        }),
      });

      // @ts-expect-error
      layout.entries = entries;
      // @ts-expect-error
      layout.name = name;
      // @ts-expect-error
      layout.instantiate = (params) => {
        const bg = device.createBindGroup({
          layout,
          entries: entries.map((e, i) => ({
            binding: i,
            resource: params[e.name],
          })),
        });
        return bg;
      };

      // @ts-expect-error
      return layout;
    },
    texture<
      Name extends string,
      Format extends GPUTextureFormat,
      ViewDimension extends GPUTextureViewDimension | undefined,
      Multisampled extends boolean | undefined,
    >(
      name: Name,
      params: {
        multisampled?: Multisampled;
        visibility?: GPUShaderStageFlags;
        viewDimension?: ViewDimension;
        format: Format;
      },
    ): WrappedBindGroupTexture<
      Format,
      GPUTextureViewDimension extends ViewDimension ? "2d" : ViewDimension,
      boolean extends Multisampled ? false : Multisampled
    > & {
      name: Name;
      instantiate: (
        resolution: Vec2 | Vec3,
        usage: GPUTextureUsageFlags,
        extra?: Partial<GPUTextureDescriptor>,
      ) => GPUTexture;
    } {
      return {
        name,
        type: "texture",
        format: params.format,
        visibility: params.visibility,
        // @ts-expect-error
        viewDimension: params.viewDimension ?? "2d",
        // @ts-expect-error
        multisampled: params.multisampled ?? false,
        instantiate(resolution, usage, extra) {
          return device.createTexture({
            size: resolution,
            usage,
            format: params.format,
            ...extra,
          });
        },
      };
    },
    shader(
      code: string,
      stages: ShaderStage[] = ["vertex", "fragment", "compute"],
    ) {
      const module = device.createShaderModule({
        code,
      });
      return { module, stages };
    },
    async pipeline<
      BindGroups extends WrappedBindGroupLayoutGeneric[],
      Inputs extends WrappedBindGroupVertexBuffer<any, any, Attribute[], any>[],
      Outputs extends Record<string, OutputFormat>,
    >(params: {
      bindGroups: BindGroups;
      inputs: Inputs;
      outputs: Outputs;
      globals?: string;
      vertex: string;
      primitive?: GPUPrimitiveState;
      fragment?: {
        function: string;
        struct: string;
        extraOutputs?: string;
      };
      depthStencil?: GPUDepthStencilState;
      multisample?: GPUMultisampleState;
    }): Promise<WrappedPipeline<BindGroups, any, Inputs, Outputs>> {
      const requiredStructDefs = params.bindGroups.flatMap((bg) =>
        bg.entries.flatMap((e) => {
          if (e.type === "uniform-buffer") {
            return [e.format];
          } else {
            return [];
          }
        }),
      );

      const requiredBindings = params.bindGroups
        .flatMap((bg, groupIndex) =>
          bg.entries.flatMap((e, bindingIndex) => {
            if (e.type === "uniform-buffer") {
              return e.wgsl(groupIndex, bindingIndex);
            } else {
              return "";
            }
          }),
        )
        .join("\n");

      let shaderLoc = 0;

      const vertexStruct =
        params.inputs.length > 0
          ? `struct Vertex {
        ${params.inputs.flatMap((i) => i.attributes.map((attr) => `@location(${shaderLoc++}) ${attr.name}: ${vertexFormatToWgslType(attr.format)}`)).join(",\n")}
      }`
          : "";

      return this.pipelineRaw({
        multisample: params.multisample,
        primitive: params.primitive,
        bindGroups: params.bindGroups,
        inputs: params.inputs,
        outputs: params.outputs,
        depthStencil: params.depthStencil,
        shader: this.shader(
          `
        ${createWgslSerializers(...requiredStructDefs).code}
        ${requiredBindings}
        ${params.globals ?? ""}
        ${vertexStruct}

        struct FragInput {
          ${params.fragment?.struct ?? ""}
        }

        struct FragOutput {
          ${params.fragment.extraOutputs ?? ""}
          ${Object.entries(params.outputs)
            .map(
              ([name, value], i) =>
                `@location(${i}) ${name} : ${TEXTURE_FORMAT_TO_WGSL_TYPE_LUT[typeof value === "string" ? value : value.format]}`,
            )
            .join(",\n  ")}
        }

        @vertex
        fn VSMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32, ${vertexStruct ? "vertex: Vertex" : ""}) -> FragInput {
          ${params.vertex} 
        }

      ${
        params.fragment
          ? `@fragment
        fn FSMain(input : FragInput) -> FragOutput {
          ${params.fragment.function}
        }`
          : ""
      }
        `,
          params.fragment ? ["vertex", "fragment"] : ["vertex"],
        ),
      });

      // ${params.depthStencil?.depthWriteEnabled ? `,\n  @builtin(frag_depth) depth : f32` : ""}
    },

    async pipelineRaw<
      BindGroups extends WrappedBindGroupLayoutGeneric[],
      Shader extends WrappedShader,
      Inputs extends WrappedBindGroupVertexBuffer<any, any, any, any>[],
      Outputs extends Record<string, OutputFormat>,
    >(params: {
      bindGroups: BindGroups;
      shader: Shader;
      inputs: Inputs;
      outputs: Outputs;
      primitive?: GPUPrimitiveState;
      depthStencil?: GPUDepthStencilState;
      multisample?: GPUMultisampleState;
    }): Promise<WrappedPipeline<BindGroups, Shader, Inputs, Outputs>> {
      let vertex = undefined;

      if (params.shader.stages.includes("vertex")) {
        const buffers = [];

        let shaderLoc = 0;

        for (const b of params.inputs) {
          let currBuffer = {
            arrayStride: b.arrayStride,
            stepMode: b.stepMode,
            attributes: [],
          };
          buffers.push(currBuffer);

          for (const a of b.attributes) {
            currBuffer.attributes.push({
              format: a.format,
              offset: a.offset,
              shaderLocation: shaderLoc,
            });

            shaderLoc++;
          }
        }

        vertex = {
          module: params.shader.module,
          buffers,
        };
      }

      let fragment: GPUFragmentState | undefined = undefined;

      if (params.shader.stages.includes("fragment")) {
        fragment = {
          module: params.shader.module,
          targets: Object.values(params.outputs).map(
            (e) =>
              (typeof e === "string"
                ? { format: e }
                : (e as any)?.type === "texture"
                  ? {
                      format: e.format,
                    }
                  : e) as GPUColorTargetState,
          ),
        };
      }

      const ppln = await device.createRenderPipelineAsync({
        vertex,
        fragment,
        depthStencil: params.depthStencil,
        layout: device.createPipelineLayout({
          bindGroupLayouts: params.bindGroups.map((bg, i) => bg),
        }),
        primitive: params.primitive,
        multisample: params.multisample,
      });

      // @ts-expect-error
      ppln.bindGroups = params.bindGroups;
      // @ts-expect-error
      ppln.shader = params.shader;
      // @ts-expect-error
      ppln.inputs = params.inputs;

      // @ts-expect-error
      return ppln;
    },

    async compute<BindGroups extends WrappedBindGroupLayoutGeneric[]>(params: {
      bindGroups: BindGroups;
      workgroupSize: Vec3;
      shader: string;
      globals?: string;
      storageBufferAccess?: Record<string, "read" | "write" | "read_write">;
    }): Promise<WrappedCompute<BindGroups, any>> {
      const requiredStructDefs = params.bindGroups.flatMap((bg) =>
        bg.entries.flatMap((e) => {
          if (e.type === "uniform-buffer" || e.type === "storage-buffer") {
            return [e.format];
          } else {
            return [];
          }
        }),
      );

      const requiredBindings = params.bindGroups
        .flatMap((bg, groupIndex) =>
          bg.entries.flatMap((e, bindingIndex) => {
            if (e.type === "uniform-buffer") {
              return e.wgsl(groupIndex, bindingIndex);
            } else if (
              e.type === "vertex-buffer" ||
              e.type === "storage-buffer"
            ) {
              return e.wgslStorage(
                groupIndex,
                bindingIndex,
                params.storageBufferAccess?.[e.name] ?? "read_write",
              );
            } else {
              return "";
            }
          }),
        )
        .join("\n");

      const shaderSource = `
${createWgslSerializers(...requiredStructDefs).code}          
${requiredBindings}
${params.globals ?? ""}

@compute
@workgroup_size(${params.workgroupSize.join(", ")})
fn ComputeMain(@builtin(global_invocation_id) id: vec3u, @builtin(local_invocation_id) local_id: vec3u) {
  ${params.shader}
}
          `;

      console.log(shaderSource);
      return this.computeRaw({
        bindGroups: params.bindGroups,
        shader: this.shader(shaderSource, ["compute"]),
      });
    },

    async computeRaw<
      BindGroups extends WrappedBindGroupLayoutGeneric[],
      Shader extends WrappedShader,
    >(params: {
      bindGroups: BindGroups;
      shader: Shader;
    }): Promise<WrappedCompute<BindGroups, Shader>> {
      const ppln = await device.createComputePipelineAsync({
        compute: params.shader,
        layout: device.createPipelineLayout({
          bindGroupLayouts: params.bindGroups.map((bg, i) => bg),
        }),
      });

      // @ts-expect-error
      ppln.bindGroups = params.bindGroups;
      // @ts-expect-error
      ppln.shader = params.shader;
      // @ts-expect-error
      ppln.inputs = params.inputs;

      // @ts-expect-error
      return ppln;
    },
  };

  return wdevice;
}
