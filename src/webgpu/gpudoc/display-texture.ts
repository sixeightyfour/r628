import { Vec2, Vec4 } from "../../math/vector.generated";
import { memo } from "../../memo";
import {
  SAMPLER_TYPE_TO_WGSL_TYPE,
  TEXTURE_DIMENSIONALITIES,
  TextureFormat,
} from "../converters";
import { createSimpleFilterPipeline } from "../simple-filter";

function create2dShaderFormat(
  device: GPUDevice,
  samplerType: "float" | "uint" | "sint" | "depth",
  outputFormat: TextureFormat,
) {
  console.log("creating new pipeline", samplerType, outputFormat);
  return createSimpleFilterPipeline(device, {
    inputs: {
      input: {
        type: SAMPLER_TYPE_TO_WGSL_TYPE[samplerType],
        dimensionality:
          samplerType === "depth" ? "texture_depth_2d" : "texture_2d",
      },
    },
    outputs: {
      dst: outputFormat,
    },
    uniforms: {
      cornerA: "vec2f",
      cornerB: "vec2f",
      blackEquiv: "vec4f",
      whiteEquiv: "vec4f",
    },
    source: `
let uv2 = mix(params.cornerA, params.cornerB, uv);

let pixel = vec4f(textureSample(tex_input, sampler0, uv2));

dst = (pixel - params.blackEquiv) / (params.whiteEquiv - params.blackEquiv);
    `,
  });
}

export function textureDisplayer(device: GPUDevice) {
  const getDisplayerPipeline = memo(
    (samplerType, outputFormat: TextureFormat) =>
      create2dShaderFormat(device, samplerType, outputFormat),
  );

  return {
    displayTexture2d(
      src: {
        tex: GPUTextureView;
        samplerType: "float" | "uint" | "sint" | "depth";
        cornerA: Vec2;
        cornerB: Vec2;
        blackEquiv: Vec4;
        whiteEquiv: Vec4;
      },
      dst: {
        tex: GPUTextureView;
        format: TextureFormat;
      },
      encoder: GPUCommandEncoder,
    ) {
      const pipeline = getDisplayerPipeline(src.samplerType, dst.format);

      const uniforms = pipeline.makeUniformBuffer().setBuffer({
        cornerA: src.cornerA,
        cornerB: src.cornerB,
        blackEquiv: src.blackEquiv,
        whiteEquiv: src.whiteEquiv,
      });

      pipeline
        .withInputs({
          input: src.tex,
        })
        .withUniforms(uniforms)
        .run(encoder, {
          dst: dst.tex,
        });
    },
  };
}

export type TextureDisplayer = ReturnType<typeof textureDisplayer>;
