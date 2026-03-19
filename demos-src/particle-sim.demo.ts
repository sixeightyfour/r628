import { cartesianProduct } from "../src";
import { createLookupOptimizedSHTGenerator } from "../src/lookup-optimized-spatial-hash-table";
import {
  add2,
  distance2,
  length2,
  normalize2,
  rescale2,
  scale2,
  sub2,
  Vec2,
} from "../src/math/vector.generated";
import { range, smartRange } from "../src/range";

type Particle = {
  pos: Vec2;
  vel: Vec2;
  r: number;
};

type ForceModel = {
  f3: number;
  f2: number;
  f1: number;
  a1: number;
  a2: number;
  a3: number;
};

function createParticleForceModel(f: ForceModel) {
  const { f3, f2, f1, a3, a2, a1 } = f;

  const d23 = f3 - f2;
  const a3f = (2 * Math.sqrt(a3)) / d23;
  const m23 = (f2 + f3) / 2;

  const d12 = f2 - f1;
  const a2f = (2 * Math.sqrt(a2)) / d12;
  const m12 = (f1 + f2) / 2;

  const a3fm23 = a3f * m23;
  const f23yshift = (a3f ** 2 * d23 ** 2) / 4;

  const a2fm12 = a2f * m12;
  const f12yshift = (a2f ** 2 * d12 ** 2) / 4;

  const f01yshift = a1 / f1 ** 2;

  return (x: number) => {
    if (x > f3) return 0;
    if (x > f2) return -((a3f * x - a3fm23) ** 2) + f23yshift;
    if (x > f1) return (a2f * x - a2fm12) ** 2 - f12yshift;
    return a1 / x ** 2 - f01yshift;
  };
}

// https://www.desmos.com/calculator/9wiulw7r6w
// function particleForceMagnitude(f: ForceModel, x: number) {
//   const { f3, f2, f1, a3, a2, a1 } = f;
//   if (x > f3) return 0;
//   if (x > f2) {
//     const d23 = f3 - f2;
//     const a3f = (2 * Math.sqrt(a3)) / d23;
//     const m23 = (f2 + f3) / 2;
//     return -((a3f * x - a3f * m23) ** 2) + (a3f ** 2 * d23 ** 2) / 4;
//   }
//   if (x > f1) {
//     const d12 = f2 - f1;
//     const a2f = (2 * Math.sqrt(a2)) / d12;
//     const m12 = (f1 + f2) / 2;
//     return (a2f * x - a2f * m12) ** 2 - (a2f ** 2 * d12 ** 2) / 4;
//   }
//   return a1 / x ** 2 - a1 / f1 ** 2;
// }

const getForceMag = createParticleForceModel({
  f1: 9,
  f2: 13,
  f3: 20,
  a1: 100,
  a2: 1,
  a3: 0.1,
});

const shtgen = createLookupOptimizedSHTGenerator<Particle>({
  bounds: {
    a: [0, 0],
    b: [1024, 1024],
  },
  resolution: [80, 80],
  getBounds: (c) => ({
    a: [c.pos[0] - c.r, c.pos[1] - c.r],
    b: [c.pos[0] + c.r, c.pos[1] + c.r],
  }),
  estimatedObjectsPerBucket: 10,
});

const LATTICE_DIST = 9;

const LATTICE_X = 20;
const LATTICE_Y = 20;

const particles: Particle[] = cartesianProduct(
  smartRange(LATTICE_X),
  smartRange(LATTICE_Y),
).map(([a, b]) => {
  const pos: Vec2 = [
    a.remap(100, 100 + LATTICE_DIST * LATTICE_X) +
      ((b.i % 2) * LATTICE_DIST) / 2,
    b.remap(100, 100 + (LATTICE_DIST * LATTICE_Y * Math.sqrt(3)) / 2),
  ];

  let vel: Vec2 = [0, 0];

  if (distance2(pos, [150, 150]) < 40) {
    vel = [3, 3];
  }

  return { pos, vel, r: 20 };
});

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = 1024;
canvas.height = 1024;
const ctx = canvas.getContext("2d")!;

function physicsIter(dt: number) {
  const sht = shtgen(particles);

  for (const a of particles) {
    let force: Vec2 = [0, 0];
    for (const b of sht.queryPoint(a.pos)) {
      if (a === b) continue;
      const offset = sub2(a.pos, b.pos);
      const dist = length2(offset);
      const force2 = rescale2(offset, getForceMag(dist));
      force = add2(force, force2);
    }
    a.vel = add2(a.vel, scale2(force, dt));
  }

  for (const a of particles) {
    a.pos = add2(a.pos, scale2(a.vel, dt));
  }
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of particles) {
    ctx.fillRect(...p.pos, 2, 2);
  }

  // console.log(particles[0].pos)

  let t = performance.now();

  let iters = 0;

  while (performance.now() - t < 10) {
    iters++;
    physicsIter(0.004);
  }

  console.log(iters);

  requestAnimationFrame(loop);
}

loop();
