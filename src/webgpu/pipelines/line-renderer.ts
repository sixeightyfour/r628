import { Mat4, scale4, Vec3, Vec4 } from "../../math/vector.generated";
import { range, rangeFrom } from "../../range";
import {
  OutputFormat,
  pipelineRenderpass,
  wrapDevice,
  WrappedBindGroupLayoutGeneric,
  WrappedBindGroupVertexBuffer,
  WrappedBindGroupVertexBufferGeneric,
} from "../partial-pipelines";
import { struct, WGSLStructSpec } from "../wgsl-struct-layout-generator";

export async function lineRenderer(
  device: GPUDevice,
  outputFormat: GPUTextureFormat,
  settings?: {
    multisample: GPUMultisampleState;
  },
) {
  const wdevice = wrapDevice(device);

  const depthTexFormat = wdevice.texture("depth", {
    format: "depth32float",
    multisampled: settings?.multisample?.count > 1,
  });

  const colorTexFormat = wdevice.texture("color", {
    format: outputFormat,
    multisampled: settings?.multisample?.count > 1,
  });

  const EVERYWHERE =
    GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

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
    visibility: EVERYWHERE,
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

  const pointInstanceBufferFormat = wdevice.vertexBuffer("points", {
    types: [
      {
        name: "position",
        format: "float32x3",
        offset: 0,
      },
      {
        name: "size",
        format: "float32",
        offset: 12,
      },
      {
        name: "color",
        format: "unorm8x4",
        offset: 16,
      },
    ] as const,
    stride: 20,
    stepMode: "instance",
    visibility: EVERYWHERE,
  });

  const lineSegInstanceBufferFormat1 = wdevice.vertexBuffer("lineSegments1", {
    types: [
      {
        name: "position1",
        format: "float32x3",
        offset: 0,
      },
      {
        name: "size1",
        format: "float32",
        offset: 12,
      },
      {
        name: "color1",
        format: "unorm8x4",
        offset: 16,
      },
    ] as const,
    stride: 20,
    stepMode: "instance",
    visibility: EVERYWHERE,
  });
  const lineSegInstanceBufferFormat2 = wdevice.vertexBuffer("lineSegments2", {
    types: [
      {
        name: "position2",
        format: "float32x3",
        offset: 0,
      },
      {
        name: "size2",
        format: "float32",
        offset: 12,
      },
      {
        name: "color2",
        format: "unorm8x4",
        offset: 16,
      },
    ] as const,
    stride: 20,
    stepMode: "instance",
    visibility: EVERYWHERE,
  });

  const uniforms = wdevice.uniformBuffer(
    "params",
    struct("Params", {
      mvp: "mat4x4f",
      aspect: "f32",
    }),
  );

  const perFrameBindGroup = wdevice.bindGroup("perFrame", uniforms);

  const blend: GPUBlendState | undefined = undefined; /* {
    color: {
      operation: "add",
      srcFactor: "one",
      dstFactor: "one-minus-src-alpha",
      // dstFactor: "zero",
    },
    alpha: {
      operation: "add",
      srcFactor: "one",
      // dstFactor: "one",
      dstFactor: "one-minus-src-alpha"
      // dstFactor: "zero",
    },
  };*/

  // const blend = undefined;

  const pointPipeline = await wdevice.pipeline({
    multisample: settings.multisample,
    depthStencil: {
      format: "depth32float",
      depthCompare: "less",
      depthWriteEnabled: true,
    },
    inputs: [pointInstanceBufferFormat, geometryBufferFormat] as const,
    outputs: {
      color: {
        format: outputFormat,
        blend,
      },
    },
    bindGroups: [perFrameBindGroup] as const,
    vertex: `
      var frag: FragInput;
      let pos = params.mvp * vec4f(vertex.position, 1.0); 
      frag.position = vec4f(pos.xy + 
        vertex.geometryPosition * vertex.size
        * vec2f(1.0, params.aspect)
      , pos.zw);
      frag.signedUv = vertex.geometryPosition;
      frag.color = vertex.color;
      frag.size = vertex.size;
      return frag;
    `,
    fragment: {
      function: `
      var pixel: FragOutput;

      let mag = length(input.signedUv);

      if (mag > 1.0) { discard; }
      pixel.color = input.color;

      return pixel;`,
      struct: `@builtin(position) position : vec4f,
@location(0) color : vec4f,
@location(1) signedUv : vec2f,
@location(2) size : f32,`,
    },
  });

  const linePipeline = await wdevice.pipeline({
    multisample: settings.multisample,
    depthStencil: {
      format: "depth32float",
      depthCompare: "less",
      depthWriteEnabled: true,
    },
    inputs: [
      lineSegInstanceBufferFormat1,
      lineSegInstanceBufferFormat2,
      geometryBufferFormat,
    ] as const,
    outputs: {
      color: {
        format: outputFormat,
        blend,
      },
    },
    bindGroups: [perFrameBindGroup] as const,
    vertex: `
      var frag: FragInput;
      let pos1 = params.mvp * vec4f(vertex.position1, 1.0); 
      let pos2 = params.mvp * vec4f(vertex.position2, 1.0); 

      let offset = normalize(pos2.xy / pos2.w - pos1.xy / pos1.w);

      var localy = vec3f(
        -offset.y, offset.x * params.aspect
      , 0.0);


      let uv = vertex.geometryPosition * 0.5 + 0.5;

      let size = mix(
        vertex.size1,
        vertex.size2,
        uv.x 
      );

      frag.position = vec4f(
        mix(
          pos1.xy,
          pos2.xy,
          uv.x 
        ), 
        mix(
          pos1.zw,
          pos2.zw,
          uv.x 
        )
      ) + vec4f(
        localy * vertex.geometryPosition.y * size, 
        0.0  
      );

      frag.color = mix(vertex.color1, vertex.color2, uv.x);

      frag.size = size / frag.position.z;
      frag.signedUv = vertex.geometryPosition;

      return frag;
    `,
    fragment: {
      function: `
      var pixel: FragOutput;
      pixel.color = input.color;
      return pixel;`,
      struct: `@location(0) color : vec4f,
@builtin(position) position : vec4f,
@location(1) signedUv : vec2f,
@location(2) size : f32,`,
    },
  });

  return {
    depthTexFormat,
    colorTexFormat,
    pointInstanceBufferFormat,
    lineSegInstanceBufferFormat1,
    lineSegInstanceBufferFormat2,
    geometryBufferFormat,
    uniforms,
    quad,
    blend,
    perFrameBindGroup,
    linePipeline,
    pointPipeline,
    createEmptyLines(count: number, depthLoadOp: "clear" | "load") {
      const perFrameUniforms = uniforms.instantiate(1);

      const perFrame = perFrameBindGroup.instantiate({
        params: perFrameUniforms,
      });

      const vertexBuf = pointInstanceBufferFormat.instantiate(count);

      const pass = device.createRenderBundleEncoder({
        colorFormats: [outputFormat],
        depthStencilFormat: depthTexFormat.format,
      });

      pass.setPipeline(pointPipeline);

      pipelineRenderpass(
        pointPipeline,
        pass,
      )({
        points: vertexBuf,
        geometry: quad,
        perFrame,
      });

      pass.draw(6, count);

      pass.setPipeline(linePipeline);

      pipelineRenderpass(
        linePipeline,
        pass,
      )({
        lineSegments1: lineSegInstanceBufferFormat1.reinterpret(vertexBuf),
        lineSegments2: [
          lineSegInstanceBufferFormat2.reinterpret(vertexBuf),
          20,
        ],
        geometry: quad,
      });

      pass.draw(6, count - 1);

      const bundle = pass.finish();

      return {
        buffer: vertexBuf,
        draw(target: GPUTexture, depthTarget: GPUTexture, transform: Mat4) {
          uniforms.fill(perFrameUniforms, 0, {
            aspect: target.width / target.height,
            mvp: transform,
          });

          const encoder = device.createCommandEncoder();

          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: target,
                loadOp: "load",
                storeOp: "store",
              },
            ],
            depthStencilAttachment: {
              view: depthTarget,
              depthClearValue: 1.0,
              depthLoadOp: depthLoadOp,
              depthStoreOp: "store",
            },
          });

          pass.executeBundles([bundle]);

          pass.end();

          device.queue.submit([encoder.finish()]);
        },
      };
    },
    createLines(
      points: Vec3[],
      color: Vec4,
      thickness: number,
      depthLoadOp: "clear" | "load",
    ) {
      const perFrameUniforms = uniforms.instantiate(1);

      const perFrame = perFrameBindGroup.instantiate({
        params: perFrameUniforms,
      });

      const vertexBuf = pointInstanceBufferFormat.quickCreate(
        points.map((position) => ({
          position,
          color,
          size: thickness,
        })),
      );

      const pass = device.createRenderBundleEncoder({
        colorFormats: [outputFormat],
        depthStencilFormat: depthTexFormat.format,
      });

      pass.setPipeline(pointPipeline);

      pipelineRenderpass(
        pointPipeline,
        pass,
      )({
        points: vertexBuf,
        geometry: quad,
        perFrame,
      });

      pass.draw(6, points.length);

      pass.setPipeline(linePipeline);

      pipelineRenderpass(
        linePipeline,
        pass,
      )({
        lineSegments1: lineSegInstanceBufferFormat1.reinterpret(vertexBuf),
        lineSegments2: [
          lineSegInstanceBufferFormat2.reinterpret(vertexBuf),
          20,
        ],
        geometry: quad,
      });

      pass.draw(6, points.length - 1);

      const bundle = pass.finish();

      return {
        draw(target: GPUTexture, depthTarget: GPUTexture, transform: Mat4) {
          uniforms.fill(perFrameUniforms, 0, {
            aspect: target.width / target.height,
            mvp: transform,
          });

          const encoder = device.createCommandEncoder();

          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: target,
                loadOp: "load",
                storeOp: "store",
              },
            ],
            depthStencilAttachment: {
              view: depthTarget,
              depthClearValue: 1.0,
              depthLoadOp: depthLoadOp,
              depthStoreOp: "store",
            },
          });

          pass.executeBundles([bundle]);

          pass.end();

          device.queue.submit([encoder.finish()]);
        },
      };
    },
    drawLinesSimple(
      target: GPUTexture,
      depthTarget: GPUTexture,
      depthLoadOp: "clear" | "load",
      points: Vec3[],
      color: Vec4,
      thickness: number,
      transform: Mat4,
    ) {
      const vertexBuf = pointInstanceBufferFormat.quickCreate(
        points.map((position) => ({
          position,
          color,
          size: thickness,
        })),
      );

      const encoder = device.createCommandEncoder();

      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: target,
            loadOp: "load",
            storeOp: "store",
          },
        ],
        depthStencilAttachment: {
          view: depthTarget,
          depthClearValue: 1.0,
          depthLoadOp: depthLoadOp,
          depthStoreOp: "store",
        },
      });

      pass.setPipeline(pointPipeline);

      const bg = perFrameBindGroup.instantiate({
        params: uniforms.quickCreate({
          mvp: transform,
          aspect: target.width / target.height,
        }),
      });

      pipelineRenderpass(
        pointPipeline,
        pass,
      )({
        points: vertexBuf,
        geometry: quad,
        perFrame: bg,
      });

      pass.draw(6, points.length);

      pass.setPipeline(linePipeline);

      pipelineRenderpass(
        linePipeline,
        pass,
      )({
        lineSegments1: lineSegInstanceBufferFormat1.reinterpret(vertexBuf),
        lineSegments2: [
          lineSegInstanceBufferFormat2.reinterpret(vertexBuf),
          20,
        ],
        geometry: quad,
      });

      pass.draw(6, points.length - 1);

      pass.end();

      device.queue.submit([encoder.finish()]);
    },
  };
}
