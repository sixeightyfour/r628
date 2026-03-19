import { makeDelimitedReplacements } from "../stringutils";
import { WgslReflect } from "wgsl_reflect";

import SimpleFilterSource from "./simple-filter.wgsl?raw";
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
import {
  TEXTURE_DIMENSIONALITIES,
  TEXTURE_FORMAT_TO_WGSL_TYPE_LUT,
  TextureFormat,
  WGSL_TYPE_ALIGNMENTS,
} from "./converters";
import {
  createLayoutGenerator,
  generateLayouts,
  GenerateWGSLStructFromCompactRepr,
  struct,
  WGSLStructSpec,
  WGSLStructValues,
} from "./wgsl-struct-layout-generator";

function createSimpleFilterShader(params: {
  textures: string;
  globals: string;
  outputStruct: string;
  fragmentBody: string;
}) {
  return makeDelimitedReplacements(SimpleFilterSource, [
    {
      delimiter: "/*TEXTURES*/",
      replaceWith: params.textures,
    },
    {
      delimiter: "/*GLOBALS*/",
      replaceWith: params.globals,
    },
    {
      delimiter: "/*OUTPUT_STRUCT*/",
      replaceWith: params.outputStruct,
    },
    {
      delimiter: "/*FRAGMENT_BODY*/",
      replaceWith: params.fragmentBody,
    },
  ]);
}

type SimpleFilterInputTextures = Record<
  string,
  {
    type?: "f32" | "i32" | "u32";
    dimensionality?: keyof typeof TEXTURE_DIMENSIONALITIES;
    sampleWith?: number; // default to Sampler 0, if available
  }
>;

type SimpleFilterOutputTextures = Record<string, TextureFormat>;

type SimpleFilterSamplers = GPUSamplerDescriptor[];

type WebGPUPrimitiveBase<T extends string, S extends string> =
  | `vec${S}${T}`
  | `${T}32`
  | `mat${S}x${S}f`
  | `mat${S}`;

type WebGPUPrimitive = WebGPUPrimitiveBase<"f" | "i" | "u", "2" | "3" | "4">;

export type UniformParameters = Record<string, WebGPUPrimitive>;
type UniformParameterValues<T extends UniformParameters> = {
  [K in keyof T]: ParseUniformPrimitive<T[K]>;
};

type WithGPUBackedBuffer = {
  gpuBuffer: GPUBuffer;
};

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

export function createSimpleFilterPipeline<
  Inputs extends SimpleFilterInputTextures,
  Outputs extends SimpleFilterOutputTextures,
  Samplers extends SimpleFilterSamplers,
  Uniforms extends Record<
    string,
    keyof typeof WGSL_TYPE_ALIGNMENTS | WGSLStructSpec
  >,
>(
  device: GPUDevice,
  spec: {
    inputs: Inputs;
    outputs: Outputs;
    samplers?: Samplers;
    source: string;
    globals?: string;
    uniforms?: Uniforms;
  },
) {
  let fragmentBody = "";

  let bindings = "";

  let bindingIndex = 0;

  const inputEntries = Object.entries(spec.inputs);

  const samplers: GPUSampler[] = [];

  let hasInputs = inputEntries.length > 0;

  if (hasInputs) {
    for (const s of spec.samplers ?? [{}]) {
      bindings += `@group(0) @binding(${bindingIndex})
var sampler${bindingIndex}: sampler;\n`;
      samplers.push(device.createSampler(s));
      bindingIndex++;
    }
  }

  bindingIndex = 0;

  const nameToInputMap = new Map<string, number>();
  const nameToOutputMap = new Map<string, number>();

  let uniformBindGroupIndex = hasInputs ? 2 : 0;

  for (const [name, value] of inputEntries) {
    bindings += `@group(1) @binding(${bindingIndex}) 
var tex_${name}: ${value.dimensionality ?? "texture_2d"}<${value.type ?? "f32"}>;`;
    nameToInputMap.set(name, bindingIndex);
    fragmentBody += !value.dimensionality
      ? `  var ${name} = textureSample(tex_${name}, sampler${value.sampleWith ?? 0}, uv);\n`
      : "";
    bindingIndex++;
  }

  let outputStruct = "";

  let outputBindingIndex = 0;

  for (const [name, value] of Object.entries(spec.outputs)) {
    outputStruct += `  @location(${outputBindingIndex}) ${name}: ${TEXTURE_FORMAT_TO_WGSL_TYPE_LUT[value]},\n`;
    nameToOutputMap.set(name, outputBindingIndex);
    fragmentBody += `  var ${name}: ${TEXTURE_FORMAT_TO_WGSL_TYPE_LUT[value]};\n`;
    outputBindingIndex++;
  }

  fragmentBody += spec.source;

  fragmentBody += `\n  var OUTPUT: Output;\n`;

  const outputsEntries = Object.entries(spec.outputs);

  for (const [name, value] of outputsEntries) {
    fragmentBody += `  OUTPUT.${name} = ${name};\n`;
  }

  fragmentBody += "return OUTPUT;";

  let globals = "";

  globals += spec.globals ?? "";

  if (spec.uniforms) {
    globals += `@group(${uniformBindGroupIndex}) @binding(0) var<uniform> params : Params;
struct Params {\n`;

    for (const [uniformName, uniformType] of Object.entries(
      spec.uniforms ?? {},
    )) {
      globals += `  ${uniformName}: ${uniformType},\n`;
    }

    globals += "}";
  }

  const shaderSource = createSimpleFilterShader({
    textures: bindings,
    globals: globals,
    outputStruct,
    fragmentBody,
  });

  const [uniformLayouts] = spec.uniforms
    ? // @ts-expect-error
      generateLayouts([struct("Params", spec.uniforms)])
    : undefined;

  const uniformGenerator = createLayoutGenerator(uniformLayouts);

  const module = device.createShaderModule({
    code: shaderSource,
  });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module },
    fragment: {
      module,
      targets: outputsEntries.map(([name, value]) => ({
        format: value,
      })),
    },
  });

  const samplerBindGroup = hasInputs
    ? device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: samplers.map((s, i) => ({
          resource: s,
          binding: i,
        })),
      })
    : undefined;

  return {
    pipeline,
    makeUniformBuffer() {
      const buffer = device.createBuffer({
        size: 1024,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      });

      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(uniformBindGroupIndex),
        entries: [
          {
            resource: buffer,
            binding: 0,
          },
        ],
      });

      const ret = {
        buffer,
        bindGroup,
        setBuffer(
          values: WGSLStructValues<
            GenerateWGSLStructFromCompactRepr<"Params", Uniforms>
          >,
        ) {
          const buf = new ArrayBuffer(uniformLayouts.size);
          uniformGenerator(new DataView(buf), values);
          device.queue.writeBuffer(buffer, 0, buf);
          return ret;
        },
      };

      return ret;
    },
    withInputs(inputs: {
      [K in keyof Inputs]: GPUTextureView;
    }) {
      const inputTextureBindGroup = hasInputs
        ? device.createBindGroup({
            layout: pipeline.getBindGroupLayout(1),
            entries: inputEntries.map(([name, value], i) => ({
              resource: inputs[name],
              binding: i,
            })),
          })
        : undefined;

      return {
        withDedicatedUniformBuffer(existingBufferInfo?: {
          buffer: GPUBuffer;
          offset?: number;
        }) {
          const uniformBuffer =
            existingBufferInfo?.buffer ??
            device.createBuffer({
              size: uniformLayouts.size,
              usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            });

          const uniformBufferOffset = existingBufferInfo?.offset ?? 0;

          const uniformBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(uniformBindGroupIndex),
            entries: [
              {
                binding: 0,
                resource: uniformBuffer,
              },
            ],
          });

          function record(bundleEncoder: GPURenderBundleEncoder) {
            bundleEncoder.setPipeline(pipeline);

            if (hasInputs) bundleEncoder.setBindGroup(0, samplerBindGroup);

            if (hasInputs) bundleEncoder.setBindGroup(1, inputTextureBindGroup);

            bundleEncoder.setBindGroup(uniformBindGroupIndex, uniformBindGroup);

            bundleEncoder.draw(6);
          }

          const defaultBundleEncoder = device.createRenderBundleEncoder({
            colorFormats: outputsEntries.map((o) => o[1]),
          });

          record(defaultBundleEncoder);

          const bundle = defaultBundleEncoder.finish();

          return {
            run: (
              encoder: GPUCommandEncoder,
              outputs: {
                [K in keyof Outputs]:
                  | GPUTextureView
                  | GPURenderPassColorAttachment;
              },
            ) => {
              const pass = encoder.beginRenderPass({
                colorAttachments: outputsEntries.map(([name, value]) =>
                  outputs[name] instanceof GPUTextureView
                    ? {
                        view: outputs[name],
                        clearValue: [0, 0, 0, 1],
                        loadOp: "clear",
                        storeOp: "store",
                      }
                    : outputs[name],
                ),
              });

              pass.executeBundles([bundle]);

              pass.end();
            },

            bundle,

            runWithRenderPass: (pass: GPURenderPassEncoder) => {
              pass.executeBundles([bundle]);
            },

            record: record,

            setUniforms(
              values: WGSLStructValues<
                GenerateWGSLStructFromCompactRepr<"Params", Uniforms>
              >,
            ) {
              const buf = new ArrayBuffer(uniformLayouts.size);
              uniformGenerator(new DataView(buf), values);
              device.queue.writeBuffer(uniformBuffer, uniformBufferOffset, buf);
            },
          };
        },

        withUniforms: (
          uniforms: keyof Uniforms extends never
            ? undefined
            : { bindGroup: GPUBindGroup },
        ) => {
          function record(bundleEncoder: GPURenderBundleEncoder) {
            bundleEncoder.setPipeline(pipeline);

            if (hasInputs) bundleEncoder.setBindGroup(0, samplerBindGroup);

            if (hasInputs) bundleEncoder.setBindGroup(1, inputTextureBindGroup);

            if (uniforms)
              bundleEncoder.setBindGroup(
                uniformBindGroupIndex,
                uniforms.bindGroup,
              );

            bundleEncoder.draw(6);
          }

          const defaultBundleEncoder = device.createRenderBundleEncoder({
            colorFormats: outputsEntries.map((o) => o[1]),
          });

          record(defaultBundleEncoder);

          const bundle = defaultBundleEncoder.finish();

          return {
            run: (
              encoder: GPUCommandEncoder,
              outputs: {
                [K in keyof Outputs]:
                  | GPUTextureView
                  | GPURenderPassColorAttachment;
              },
            ) => {
              const pass = encoder.beginRenderPass({
                colorAttachments: outputsEntries.map(([name, value]) =>
                  outputs[name] instanceof GPUTextureView
                    ? {
                        view: outputs[name],
                        clearValue: [0, 0, 0, 1],
                        loadOp: "clear",
                        storeOp: "store",
                      }
                    : outputs[name],
                ),
              });

              pass.executeBundles([bundle]);

              pass.end();
            },

            bundle,

            runWithRenderPass: (pass: GPURenderPassEncoder) => {
              pass.executeBundles([bundle]);
            },

            record: record,
          };
        },
      };
    },
  };
}
