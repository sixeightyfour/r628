import { roundUp } from "../math/round";
import { sub3, Vec3 } from "../math/vector.generated";
import { range } from "../range";
import {
  getCopyFootprintPerTexel,
  TEXEL_BLOCK_COPY_FOOTPRINTS,
  TextureFormat,
} from "./converters";
import {
  generateLayouts,
  readWgslLayout,
  WGSLStructSpec,
  WGSLStructValues,
} from "./wgsl-struct-layout-generator";

export function readPixelsSizeReq(params: {
  format: TextureFormat;
  subregion: [Vec3, Vec3];
}) {
  let { format, subregion } = params;
  const copyFootprintPerTexel = getCopyFootprintPerTexel(format)!;
  const area = sub3(subregion[1], subregion[0]);
  return roundUp(256, copyFootprintPerTexel * area[0]) * area[1] * area[2];
}

export async function readPixels(params: {
  device: GPUDevice;
  tex: GPUTexture;
  buf: GPUBuffer;
  subregion?: [Vec3, Vec3];
  mipLevel?: number;
  aspect?: "all" | "depth-only" | "stencil-only";
  offsetInBuffer?: number;
}) {
  let { device, tex, buf, subregion, mipLevel, aspect, offsetInBuffer } =
    params;

  const copyFootprintPerTexel = getCopyFootprintPerTexel(params.tex.format)!;

  if (!subregion) {
    subregion = [
      [0, 0, 0],
      [tex.width, tex.height, tex.depthOrArrayLayers],
    ];
  }

  const enc = device.createCommandEncoder();

  const area = sub3(subregion[1], subregion[0]);

  const bytesPerRow = roundUp(256, copyFootprintPerTexel * area[0]);
  const rowsPerImage = area[1];

  enc.copyTextureToBuffer(
    {
      texture: tex,
      mipLevel,
      aspect,
      origin: subregion[0],
    },
    {
      buffer: buf,
      offset: offsetInBuffer,
      bytesPerRow,
      rowsPerImage,
    },
    area,
  );

  device.queue.submit([enc.finish()]);
  await device.queue.onSubmittedWorkDone();

  await buf.mapAsync(GPUMapMode.READ);
  const range = buf.getMappedRange();

  return {
    range,
    bytesPerRow,
    rowsPerImage,
  };
}

export async function readPixelsToCpuBuffer(
  params: Parameters<typeof readPixels>[0] & {
    cpuBuffer?: ArrayBuffer;
  },
) {
  const { tex } = params;

  const size = readPixelsSizeReq({
    format: tex.format,
    subregion: params.subregion ?? [
      [0, 0, 0],
      [tex.width, tex.height, tex.depthOrArrayLayers],
    ],
  });

  const cpuBuffer = params.cpuBuffer ?? new ArrayBuffer(size);

  const mappedBuffer = await readPixels(params);

  const mappedBufferContents = new Uint8Array(mappedBuffer.range);
  const cpuBufferContents = new Uint8Array(cpuBuffer);

  for (let i = 0; i < mappedBufferContents.length; i++) {
    cpuBufferContents[i] = mappedBufferContents[i];
  }

  params.buf.unmap();

  return {
    cpuBuffer,
    bytesPerRow: mappedBuffer.bytesPerRow,
    rowsPerImage: mappedBuffer.rowsPerImage,
    size,
  };
}

export async function quickMap(
  device: GPUDevice,
  buf: GPUBuffer,
  size?: number,
  offset?: number,
) {
  const staging = device.createBuffer({
    size: size ?? buf.size,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const enc = device.createCommandEncoder();
  enc.copyBufferToBuffer(buf, offset ?? 0, staging, 0, size ?? buf.size);
  device.queue.submit([enc.finish()]);

  await device.queue.onSubmittedWorkDone();

  await staging.mapAsync(GPUMapMode.READ, offset ?? 0, size ?? buf.size);

  const range = staging.getMappedRange(0, size ?? buf.size).slice();
  staging.unmap();
  return range;
}

export async function quickMapWithFormat<S extends WGSLStructSpec>(
  format: S,
  device: GPUDevice,
  buf: GPUBuffer,
  size?: number,
  offset?: number,
): Promise<WGSLStructValues<S>> {
  const [withLayouts] = generateLayouts([format]);

  const v = new DataView(await quickMap(device, buf, size, offset));

  // @ts-expect-error
  return range(Math.floor(v.byteLength / withLayouts.size)).map((i) =>
    readWgslLayout(withLayouts, v, i * withLayouts.size),
  );
}
