import { Vec4 } from "../../math/vector.generated";
import { pipelineRenderpass, wrapDevice } from "../partial-pipelines";
import { struct } from "../wgsl-struct-layout-generator";

export async function clearRenderer(
  device: GPUDevice,
  outputFormat: GPUTextureFormat,
  settings?: { multisample?: GPUMultisampleState },
) {
  const wdevice = wrapDevice(device);

  const geometryBufferFormat = wdevice.vertexBuffer("geometry", {
    types: [
      {
        name: "geometryPosition",
        format: "float32x2",
        offset: 0,
      },
    ] as const,
    stride: 8,
    stepMode: "vertex",
    visibility: GPUShaderStage.VERTEX,
  });

  const quad = geometryBufferFormat.quickCreate([
    {
      geometryPosition: [-1, -1],
    },
    {
      geometryPosition: [1, -1],
    },
    {
      geometryPosition: [-1, 1],
    },
    {
      geometryPosition: [1, -1],
    },
    {
      geometryPosition: [-1, 1],
    },
    {
      geometryPosition: [1, 1],
    },
  ]);

  const uniforms = wdevice.uniformBuffer(
    "params",
    struct("Params", {
      clearColor: "vec4f",
    }),
  );

  const perFrameBindGroup = wdevice.bindGroup("perFrame", uniforms);

  const pipeline = await wdevice.pipeline({
    inputs: [geometryBufferFormat] as const,
    outputs: {
      color: {
        format: outputFormat,
      },
    },
    bindGroups: [perFrameBindGroup] as const,
    vertex: `
    var frag: FragInput;
    frag.position = vec4f(vertex.geometryPosition.xy, 1.0, 1.0);
    return frag;
`,
    fragment: {
      function: `
      var pixel: FragOutput;
      pixel.color = params.clearColor;
      return pixel;
      `,
      struct: `@builtin(position) position : vec4f
      `,
    },
    multisample: settings?.multisample,
  });

  const perFrameUniforms = uniforms.instantiate(1);

  const perFrame = perFrameBindGroup.instantiate({
    params: perFrameUniforms,
  });

  const pass = device.createRenderBundleEncoder({
    colorFormats: [outputFormat],
    sampleCount: settings?.multisample?.count,
  });

  pass.setPipeline(pipeline);

  pipelineRenderpass(
    pipeline,
    pass,
  )({
    geometry: quad,
    perFrame,
  });

  pass.draw(6);

  const bundle = pass.finish();

  return {
    clear(tex: GPUTexture, color: Vec4, resolveTarget?: GPUTexture) {
      uniforms.fill(perFrameUniforms, 0, {
        clearColor: color,
      });

      const encoder = device.createCommandEncoder();

      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: tex.createView(),
            loadOp: "clear",
            storeOp: "store",
            resolveTarget: resolveTarget?.createView(),
          },
        ],
      });

      pass.executeBundles([bundle]);

      pass.end();

      device.queue.submit([encoder.finish()]);
    },
  };
}
