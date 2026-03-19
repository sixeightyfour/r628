import { add2, scale2, sub2, Vec2 } from "../src/math/vector.generated";
import { range, smartRange } from "../src/range";
import { Circle, inCircle, spatialHashTable } from "../src/spatial-hash-table";

const LINE_COUNT = 100;
const POINTS_PER_LINE = 100;

type Eyeball = {
  irisRadius: number;
  pupilRadius: number;
  forceRadius: number;
  pos: Vec2;
};

type Point = { pos: Vec2 };
type Edge = {};

const eyeballs = spatialHashTable<Eyeball>(
  {
    a: [-0.3, -0.3],
    b: [1.3, 1.3],
  },
  [100, 100],
  (e) => {
    const maxRadius = Math.max(e.forceRadius, e.irisRadius, e.pupilRadius);
    return {
      a: sub2(e.pos, [maxRadius, maxRadius]),
      b: add2(e.pos, [maxRadius, maxRadius]),
    };
  },
);

for (const i of smartRange(10000000)) {
  const radius = Math.pow(10, i.remap(-1.1, -4));
  const center: Vec2 = [Math.random(), Math.random()];

  if (
    inCircle(eyeballs, { radius, center }, (t) => ({
      radius: t.irisRadius * 1.0,
      center: t.pos,
    })).size > 0
  ) {
    continue;
  }

  eyeballs.insert({
    pos: center,
    irisRadius: radius,
    pupilRadius: radius * 0.5,
    forceRadius: radius * 1.5,
  });
}

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = 2048;
canvas.height = 2048;
const ctx = canvas.getContext("2d")!;

function circle(ctx: CanvasRenderingContext2D, c: Circle) {
  ctx.moveTo(c.center[0], c.center[1]);
  ctx.arc(c.center[0], c.center[1], c.radius, 0, Math.PI * 2);
}

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "black";

ctx.beginPath();
for (const e of eyeballs.all()) {
  circle(ctx, {
    radius: e.irisRadius * canvas.width,
    center: scale2(e.pos, canvas.width),
  });
}
ctx.fill();
