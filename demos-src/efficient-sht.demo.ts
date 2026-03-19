import { createLookupOptimizedSHTGenerator } from "../src/lookup-optimized-spatial-hash-table";
import { sub2 } from "../src/math/vector.generated";
import { rand, range } from "../src/range";
import { Circle, Rect } from "../src/spatial-hash-table";

const shtgen = createLookupOptimizedSHTGenerator<Circle>({
  bounds: {
    a: [0, 0],
    b: [1024, 1024],
  },
  resolution: [100, 100],
  getBounds: (c) => ({
    a: [c.center[0] - c.radius, c.center[1] - c.radius],
    b: [c.center[0] + c.radius, c.center[1] + c.radius],
  }),
  estimatedObjectsPerBucket: 10,
});

const circles: Circle[] = range(10000).map((e) => {
  return {
    center: [rand(0, 1024), rand(0, 1024)],
    radius: rand((1024 / 100) * 0.5, (1024 / 100) * 2),
  };
});

const sht = shtgen(circles);

console.log(sht);

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = 1024;
canvas.height = 1024;
const ctx = canvas.getContext("2d")!;

ctx.fillStyle = "#00000004";

for (const c of circles) {
  ctx.beginPath();
  ctx.arc(c.center[0], c.center[1], c.radius, 0, Math.PI * 2);
  ctx.fill();
}

ctx.strokeStyle = "#0f0";

const queryRect: Rect = {
  a: [300, 400],
  b: [500, 600],
};

ctx.strokeRect(...queryRect.a, ...sub2(queryRect.b, queryRect.a));

for (const c of sht.queryRect(queryRect)) {
  ctx.beginPath();
  ctx.arc(c.center[0], c.center[1], c.radius, 0, Math.PI * 2);
  ctx.stroke();
}
