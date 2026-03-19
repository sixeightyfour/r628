// import {
//   AudioSample,
//   AudioSampleSource,
//   BufferTarget,
//   OggOutputFormat,
//   Output,
//   WavOutputFormat,
// } from "mediabunny";
import { OneDimensionalSpatialHashTable } from "../1d-spatial-hash-table";
import { argmin } from "../array-utils";
import { clamp, lerp, rescale } from "../interpolation";
import { Vec2 } from "../math/vector.generated";
import { memo } from "../memo";
import {
  arrayToObjKeys,
  mapObjEntries,
  mapObjKeys,
  mapObjValues,
} from "../object-utils";
import { range, smartRange } from "../range";
import { Rect, spatialHashTable } from "../spatial-hash-table";
import FFT from "fft.js";

export type TrackSpec<Channels extends string> = {
  start: number;
  audio: AudioStream<Channels>;
}[];

export function createTrack<Channels extends string>(
  channels: Channels[],
  sampleRate: number,
  constituents: TrackSpec<Channels>,
) {
  const maxlen = Math.max(
    ...constituents.map((c) => c.start + c.audio.duration),
  );

  const sht = new OneDimensionalSpatialHashTable<{
    start: number;
    audio: AudioStream<Channels>;
  }>(constituents.length, 0, maxlen, (a) => ({
    start: a.start,
    end: a.start + a.audio.duration,
  }));

  for (const c of constituents) sht.add(c);

  return new AudioStream<Channels>({
    channels,
    sampleRate,
    duration: maxlen,
    async getRange(start, count) {
      const startTime = start / sampleRate;
      const endTime = (start + count) / sampleRate;
      const audio = sht.query(startTime, endTime);

      // @ts-expect-error
      const out: Record<Channels, Float32Array> = {};

      const inputs = await Promise.all(
        [...audio].map((e) =>
          e.audio.getRange(start - Math.ceil(e.start * sampleRate), count),
        ),
      );

      for (const ch of channels) {
        const a = new Float32Array(count);
        for (const inp of inputs) {
          for (let i = 0; i < count; i++) {
            a[i] += inp[ch][i] ?? 0;
          }
        }
        out[ch] = a;
      }

      return out;
    },
  });
}

export class AudioStream<Channels extends string> {
  constructor(params: {
    channels: Channels[];
    sampleRate: number;
    duration: number;
    getRange: (
      start: number,
      count: number,
    ) => Promise<Record<Channels, Float32Array> | undefined>;
  }) {
    this.getRange = async (start, count) => {
      const estimatedLength = Math.ceil(this.sampleRate * this.duration);
      const clampedStart = clamp(start, 0, estimatedLength);
      const clampedEnd = clamp(start + count, 0, estimatedLength);

      const range = await params.getRange(
        clampedStart,
        clampedEnd - clampedStart,
      );

      if (clampedEnd - clampedStart == count) return range;

      // @ts-expect-error
      const out: Record<Channels, Float32Array> = {};

      const padStart = -Math.min(0, start);

      for (const ch of this.channels) {
        console.log("eeeee", count);
        const o = new Float32Array(count);
        const i = range[ch];

        for (let idx = 0; idx < i.length; idx++) {
          o[idx + padStart] = i[idx];
        }

        out[ch] = o;
      }

      return out;
    };
    this.duration = params.duration;
    this.sampleRate = params.sampleRate;
    this.channels = params.channels;
  }

  channels: Channels[];
  sampleRate: number;
  duration: number;

  getRange: (
    start: number,
    count: number,
  ) => Promise<Record<Channels, Float32Array> | undefined>;

  gain(gain: MonoOrMulti<Channels>) {
    return combineAudio(
      this.channels,
      this.sampleRate,
      [this, gain],
      (time, sample, a, g) => mapObjValues(a, (k, x) => x * g[k]),
      this.duration,
    );
  }

  add(stream: AudioStream<Channels>) {
    return combineAudio(
      this.channels,
      this.sampleRate,
      [this, stream],
      (time, sample, a, b) => mapObjValues(a, (k, x) => x + b[k]),
    );
  }

  clip(start: number, end: number) {
    return new AudioStream({
      channels: this.channels,
      duration: end - start,
      sampleRate: this.sampleRate,
      getRange: (start2: number, count2: number) => {
        return this.getRange(
          start2 + Math.floor(start * this.sampleRate),
          count2,
        );
      },
    });
  }

  convolve(_kernel: MonoOrMulti<Channels>) {
    const kernel = broadcastTo(this.channels, this.sampleRate, _kernel);

    const kernelSampleCount = Math.ceil(kernel.duration * kernel.sampleRate);

    const kernelData = kernel.getRange(0, kernelSampleCount);

    return new AudioStream({
      channels: this.channels,
      duration: this.duration,
      sampleRate: this.sampleRate,
      getRange: async (start, count) => {
        const kern = await kernelData;
        return mapObjValues(
          await this.getRange(start, count + kernelSampleCount),
          (ch, v) =>
            overlapSaveConvolve(
              new Float32Array(v),
              new Float32Array(kern[ch]),
            ).slice(0, count),
        );
      },
    });
  }

  preload() {
    const bufs = this.getRange(0, Math.ceil(this.duration * this.sampleRate));
    return new AudioStream({
      channels: this.channels,
      duration: this.duration,
      sampleRate: this.sampleRate,
      getRange: async (start, count) => {
        const bufs2 = await bufs;
        return mapObjValues(bufs2, (k, v) => v.slice(start, start + count));
      },
    });
  }
}

function fft(x: Float32Array): Float32Array {
  const f = new FFT(x.length);

  const out = f.createComplexArray();

  // @ts-expect-error
  const data = f.toComplexArray(x);

  f.transform(out, data);

  return new Float32Array(out);
}

function ifft(x: Float32Array) {
  const f = new FFT(x.length / 2);

  const out = f.createComplexArray();

  f.inverseTransform(out, x);

  return new Float32Array(range(out.length / 2).map((i) => out[i * 2]));
}

function fftConvolve(x: Float32Array, h: Float32Array) {
  const arr1 = fft(x);
  const arr2 = fft(h);

  let out = new Float32Array(arr1.length);

  for (let i = 0; i < arr1.length; i += 2) {
    out[i] = arr1[i] * arr2[i] - arr1[i + 1] * arr2[i + 1];
    out[i + 1] = arr1[i] * arr2[i + 1] + arr1[i + 1] * arr2[i];
  }

  return ifft(out);
}

function nextPowerOfTwo(x: number) {
  return Math.pow(2, Math.ceil(Math.log2(x)));
}

function zeroPad(x: Float32Array, length: number) {
  if (x.length === length) return x;

  const y = new Float32Array(length);

  for (let i = 0; i < x.length; i++) {
    y[i] = x[i];
  }

  return y;
}

const powersOfTwo = range(31).map((i) => 2 ** (i + 1));

const getOptimumOverlapSaveFilterSize = memo((M: number) => {
  const cost = (M: number, N: number) => (N * Math.log2(N + 1)) / (N - M + 1);

  return argmin(
    powersOfTwo.filter((N) => cost(M, N) > 0) as [number, ...number[]],
    (N) => cost(M, N),
  );
});

function overlapSaveConvolve(x: Float32Array, h: Float32Array): Float32Array {
  const M = h.length;
  const N = getOptimumOverlapSaveFilterSize(M);
  const kernel = zeroPad(h, N);

  const L = N - M + 1;

  const blockcount = Math.ceil(x.length / L);

  const dst = new Float32Array(L * blockcount);

  for (let i = 0; i < blockcount; i++) {
    const position = L * i;

    const xslice = zeroPad(x.slice(position, position + N), N);

    const convolved = fftConvolve(xslice, kernel);

    for (let j = 0; j < L; j++) {
      dst[position + j] = convolved[M + j - 1];
    }
  }

  return dst.slice(0, x.length);
}

export function createSignal<Channels extends string>(params: {
  sampleRate: number;
  channels: Channels[];
  length: number;
  duration: number;
  constructors:
    | Record<Channels, (time: number, sampleNumber: number) => number>
    | ((time: number, sampleNumber: number) => Record<Channels, number>);
}): AudioStream<Channels> {
  const constr = params.constructors;
  const constructors: Record<
    Channels,
    (time: number, sampleNumber: number) => number
  > =
    constr instanceof Function
      ? arrayToObjKeys(params.channels, (k) => (t, c) => constr(t, c)[k])
      : constr;

  return new AudioStream({
    channels: params.channels,
    async getRange(start: number, count: number) {
      return mapObjEntries(constructors, (k, v) => [
        k,
        new Float32Array(
          range(count).map((s) => {
            return v((s + start) / this.sampleRate, s + start);
          }),
        ),
      ]);
    },
    sampleRate: params.sampleRate,
    duration: params.duration,
  });
}

function sameSignalOnData<Channels extends string>(
  sampleRate: number,
  channels: Channels[],
  duration: number,
  f: (time: number, sample: number) => number,
) {
  return createSignal({
    channels,
    duration,
    sampleRate,
    length: Math.ceil(duration * sampleRate),
    constructors: arrayToObjKeys(channels, () => f),
  });
}

function waveform<Channels extends string>(
  sampleRate: number,
  channels: Channels[],
  seconds: number,
  frequency: number,
  amplitude: number,
  phase: number,
  profile: (f: number) => number,
) {
  return sameSignalOnData(
    sampleRate,
    channels,
    seconds,
    (t) => amplitude * profile((t * frequency + phase) % 1),
  );
}

async function getRangeAndResample<Channels extends string>(
  src: AudioStream<Channels>,
  dstStart: number,
  dstCount: number,
  dstSampleRate: number,
): Promise<Record<Channels, Float32Array>> {
  // fallthrough case for same sample rate
  if (src.sampleRate === dstSampleRate) {
    return await src.getRange(dstStart, dstCount);
  }

  // get timing info for audio range
  const startSeconds = dstStart / dstSampleRate;
  const durationSeconds = dstCount / dstSampleRate;

  // figure out the sample range to get in the source audio
  const srcStart = Math.floor(startSeconds * src.sampleRate);
  const srcCount = Math.ceil((startSeconds + durationSeconds) * src.sampleRate);

  // get that sample range in the source audio
  const srcRange = await src.getRange(srcStart, srcCount - srcStart);

  // resample audio
  return mapObjValues(srcRange, (k, v) => {
    return new Float32Array(
      range(dstCount).map((dstIndex) => {
        const time = dstIndex / dstSampleRate;
        const sourceIndex = time * src.sampleRate;

        const srcSamplePrev = Math.floor(sourceIndex);
        const srcSampleNext = srcSamplePrev + 1;

        return lerp(sourceIndex % 1, v[srcSamplePrev], v[srcSampleNext]);
      }),
    );
  });
}

function resample<Channels extends string>(
  audio: AudioStream<Channels>,
  targetSampleRate: number,
) {
  return combineAudio(
    audio.channels,
    targetSampleRate,
    [audio] as const,
    (time, sample, ch) => ch,
  );
}

function combineAudio<
  Channels extends string,
  Audio extends (AudioStream<"center"> | AudioStream<Channels>)[],
>(
  channels: Channels[],
  sampleRate: number,
  audio: Audio,
  f: (
    time: number,
    sample: number,
    ...xs: { [K in keyof Audio]: Record<Channels, number> }
  ) => {
    [K in Channels]: number;
  },
  customDuration?: number,
): AudioStream<Channels> {
  // derive duration and sample count from largest of all inputs
  const duration = customDuration
    ? customDuration
    : Math.max(...audio.map((a) => a.duration));
  const length = Math.ceil(duration * sampleRate);

  // create stream
  const stream = new AudioStream<Channels>({
    channels,
    duration,
    sampleRate,
    async getRange(start, count) {
      // get resampled audio ranges from all source tracks
      const ranges: Record<string, Float32Array>[] = await Promise.all(
        audio.map(async (a) =>
          mapObjValues(
            await getRangeAndResample(
              a as AudioStream<string>,
              start,
              count,
              sampleRate,
            ),
            (k, v) => new Float32Array(v),
          ),
        ),
      );

      // create dst audio
      const ch: Record<Channels, Float32Array> = arrayToObjKeys(
        channels,
        (k) => new Float32Array(count),
      );

      // fill dst audio
      for (const i of range(count)) {
        // reformat individual audio samples from each src track
        const samples = ranges.map((r, j) => {
          // if the track is mono, just copy its data to all channels
          if (
            audio[j].channels.length === 1 &&
            audio[j].channels[0] === "center"
          ) {
            return arrayToObjKeys(channels, () => r.center[i]);
          }

          // otherwise just use it normally
          return mapObjValues(r, (k, v) => v[i]);
        });

        const res = f(
          (start + i) / sampleRate,
          start + i,
          // @ts-expect-error
          ...samples,
        );

        for (const c of channels) {
          ch[c][i] = res[c];
        }
      }

      return ch;
    },
  });

  return stream;
}
function broadcastTo<Channels extends string>(
  channels: Channels[],
  sampleRate: number,
  mono: MonoOrMulti<Channels>,
) {
  return combineAudio(channels, sampleRate, [mono], (_, __, x) => x);
}

type MonoOrMulti<Channels extends string> =
  | AudioStream<Channels>
  | AudioStream<"center">;

function lowPassFilterSample(n: number, N: number, m: number) {
  return (
    (1 / N) *
    range(m * 2 + 1)
      .map((i) => Math.cos(((2 * Math.PI * (i - m)) / N) * n))
      .reduce((a, b) => a + b, 0)
  );
}

function hannSample(n: number, N: number) {
  return Math.sin((Math.PI * (n - N / 2)) / N) ** 2;
}

const createLowPassFilter = memo(
  <T extends string>(
    channels: T[],
    sampleRate: number,
    freq: number,
    cycles: number,
  ) => {
    const oneCycleSampleCount = Math.ceil((1 / freq) * sampleRate);
    const sampleCount = oneCycleSampleCount * cycles;
    const duration = sampleCount / sampleRate;

    console.log("created lpf");

    // const cutoff = Math.round(duration * freq);
    const cutoff = cycles;

    return createSignal({
      duration,
      sampleRate,
      channels,
      length: sampleCount,
      constructors: arrayToObjKeys(
        channels,
        () => (t, s) =>
          lowPassFilterSample(s, sampleCount, cutoff) *
          hannSample(s, sampleCount),
      ),
    }).preload();
  },
);

export class AudioBuilder<Channels extends string> {
  constructor(channels: Channels[], sampleRate: number) {
    this.channels = channels;
    this.sampleRate = sampleRate;
  }

  channels: Channels[];
  sampleRate: number;

  lpf(freq: number, cycles: number = 16) {
    return createLowPassFilter(
      this.channels,
      this.sampleRate,
      freq,
      cycles,
    ) as AudioStream<Channels>;
  }

  signal(
    duration: number,
    constructors: Parameters<typeof createSignal>[0]["constructors"],
  ) {
    return createSignal({
      sampleRate: this.sampleRate,
      channels: this.channels,
      constructors,
      duration,
      length: Math.ceil(duration * this.sampleRate),
    });
  }

  waveform(
    frequency: number,
    amplitude: number,
    phase: number,
    profile: (f: number) => number,
  ) {
    return waveform(
      this.sampleRate,
      this.channels,
      Infinity,
      frequency,
      amplitude,
      phase,
      profile,
    );
  }

  constant(x: number) {
    return createSignal({
      sampleRate: this.sampleRate,
      channels: this.channels,
      duration: Infinity,
      length: Infinity,
      constructors: arrayToObjKeys(this.channels, () => () => x),
    });
  }

  sine(
    frequency: number,
    amplitude: number = 1,
    phase: number = 0,
  ): AudioStream<Channels> {
    return this.waveform(frequency, amplitude, phase, (x) =>
      Math.sin(x * Math.PI * 2),
    );
  }

  square(
    frequency: number,
    amplitude: number = 1,
    phase: number = 0,
  ): AudioStream<Channels> {
    return this.waveform(frequency, amplitude, phase, (x) =>
      x > 0.5 ? -1 : 1,
    );
  }

  saw(
    frequency: number,
    amplitude: number = 1,
    phase: number = 0,
  ): AudioStream<Channels> {
    return this.waveform(frequency, amplitude, phase, (x) => x * 2.0 - 1.0);
  }

  noise(amplitude: number = 1): AudioStream<Channels> {
    return createSignal({
      sampleRate: this.sampleRate,
      channels: this.channels,
      duration: Infinity,
      length: Infinity,
      constructors: arrayToObjKeys(
        this.channels,
        () => () => (Math.random() * 2.0 - 1.0) * amplitude,
      ),
    });
  }

  adsrgen(a: number, d: number, s: number, r: number) {
    return (at: number, dt: number, st: number, rt: number) => {
      return sameSignalOnData(this.sampleRate, this.channels, rt, (t) => {
        if (t < at) return rescale(t, 0, at, 0, a);
        if (t < dt) return rescale(t, at, dt, a, d);
        if (t < st) return rescale(t, dt, st, d, s);
        if (t < rt) return rescale(t, st, rt, s, r);

        return 0;
      });
    };
  }

  boxcar(length: number, area: number = 1) {
    const sampleCount = Math.ceil(length * this.sampleRate);
    return this.constant(area / sampleCount).clip(
      0,
      sampleCount / this.sampleRate,
    );
  }

  adsr(
    a: number,
    at: number,
    d: number,
    dt: number,
    s: number,
    st: number,
    r: number,
    rt: number,
  ) {
    return this.adsrgen(a, d, s, r)(at, dt, st, rt);
  }

  broadcast(mono: MonoOrMulti<Channels>) {
    return broadcastTo(this.channels, this.sampleRate, mono);
  }

  createTrack(constituents: TrackSpec<Channels>) {
    return createTrack(this.channels, this.sampleRate, constituents);
  }
}

export async function playStereo(audio: AudioStream<"left" | "right">) {
  const ctx = new AudioContext();
  const src = ctx.createBufferSource();

  const len = Math.ceil(audio.sampleRate * audio.duration);

  const buf = ctx.createBuffer(2, len, audio.sampleRate);

  const range = await audio.getRange(0, len);

  buf.copyToChannel(new Float32Array(range.left), 0);
  buf.copyToChannel(new Float32Array(range.right), 1);

  src.buffer = buf;

  src.connect(ctx.destination);
  src.start();
}

export function isWorklet() {
  return globalThis.registerProcessor !== undefined;
}

const BLOCKSIZE = 8192;

export async function initBufferStreamerWorklet(src: string) {
  if (isWorklet()) {
    globalThis.registerProcessor(
      "buffer-streamer",
      // @ts-expect-error
      class extends AudioWorkletProcessor {
        constructor() {
          super();

          // @ts-expect-error
          this.port.onmessage = async (e) => {
            const data = e.data;
            if (data.type === "buffer") {
              this.buffers.push({
                left: new Float32Array(data.buffers.left),
                right: new Float32Array(data.buffers.right),
              });
            }
          };
        }

        buffers: { left: Float32Array; right: Float32Array }[] = [];
        offsetIntoCurrentBuffer = 0;

        process(inputs, outputs, parameters) {
          const output = outputs[0];
          const outputLength = output[0].length;

          for (let i = 0; i < outputLength; i++) {
            if (this.buffers.length > 0) {
              output[0][i] = this.buffers[0].left[this.offsetIntoCurrentBuffer];
              if (output[1]) {
                output[1][i] =
                  this.buffers[0].right[this.offsetIntoCurrentBuffer];
              }

              this.offsetIntoCurrentBuffer++;
              if (
                this.offsetIntoCurrentBuffer >= this.buffers[0]?.left.length
              ) {
                this.offsetIntoCurrentBuffer = 0;
                this.buffers.shift();
              }
            } else {
              output[0][i] = 0;
              if (output[1]) {
                output[1][i] = 0;
              }
            }
          }

          return true;
        }
      },
    );
  } else {
    return async (ctx: AudioContext) => {
      await ctx.audioWorklet.addModule(src);

      return () => {
        const worklet = new AudioWorkletNode(ctx, "buffer-streamer");
        return {
          worklet,
          pushData(left: Float32Array, right: Float32Array) {
            worklet.port.postMessage(
              {
                type: "buffer",
                buffers: {
                  left: left.buffer,
                  right: right.buffer,
                },
              },
              [left.buffer, right.buffer],
            );
          },
        };
      };
    };
  }
}

type BufferStreamer = ReturnType<
  Awaited<ReturnType<Awaited<ReturnType<typeof initBufferStreamerWorklet>>>>
>;

const CHUNKSIZE = 2048 * 16;

export function streamAudioToWorklet(
  stream: AudioStream<"left" | "right">,
  bs: BufferStreamer,
) {
  let t = 0;

  const loop = async () => {
    const { left, right } = await stream.getRange(t, CHUNKSIZE);

    bs.pushData(new Float32Array(left), new Float32Array(right));
    t += CHUNKSIZE;
    if (t <= Math.max(stream.duration * stream.sampleRate)) {
      setTimeout(loop);
    }
  };

  loop();
}

export function displayAudioSamples(
  samples: Float32Array,
  size: Vec2,
  amp: number = 1,
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = size[0];
  canvas.height = size[1];

  ctx.beginPath();
  for (const i of smartRange(samples.length)) {
    ctx.lineTo(
      i.remap(0, canvas.width),
      rescale(samples[i.i], -amp, amp, 0, size[1]),
    );
  }
  ctx.stroke();

  return canvas;
}

export async function displayAudio(
  stream: AudioStream<"left" | "right">,
  amp: number = 1,
  res: Vec2 = [1000, 200],
  chunks: number = 1,
) {
  const len = Math.ceil(stream.duration * stream.sampleRate);

  const left = new Float32Array(len);
  const right = new Float32Array(len);

  let divisions = smartRange(chunks + 1).map((c) =>
    Math.floor(c.remap(0, len, true)),
  );

  for (let i of range(chunks)) {
    const audio = await stream.getRange(
      divisions[i],
      divisions[i + 1] - divisions[i],
    );
    const l = new Float32Array(audio.left);
    const r = new Float32Array(audio.right);

    for (let j = 0; j < l.length; j++) {
      left[j + divisions[i]] = l[j];
      right[j + divisions[i]] = r[j];
    }
  }

  return [
    displayAudioSamples(left, res, amp),
    displayAudioSamples(right, res, amp),
  ];
}

// export async function getOgg(a: AudioStream<"left" | "right">) {
//   const output = new Output({
//     format: new WavOutputFormat(),
//     target: new BufferTarget(),
//   });

//   const sample = new AudioSample({
//     data: new Float32Array(
//       (await a.getRange(0, Math.ceil(a.sampleRate * a.duration))).left
//     ),
//     format: "f32-planar",
//     numberOfChannels: 1,
//     sampleRate: a.sampleRate,
//     timestamp: 0,
//   });

//   const src = new AudioSampleSource({
//     // codec: "opus",
//     codec: "pcm-f32",
//     // codec: "vorbis",
//     // bitrate: 128e3,
//   });
//   output.addAudioTrack(src);

//   await output.start();
//   await src.add(sample);
//   await output.finalize();

//   return new Blob([output.target.buffer!], { type: "audio/wav" });
// }
