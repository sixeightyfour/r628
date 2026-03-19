import {
  range,
  cartesianProduct,
  smartRangeMap,
  smartRange,
  rand,
} from "../src/range";
import {
  add2,
  length2,
  scale2,
  sub2,
  Vec2,
  w,
} from "../src/math/vector.generated";
import { bifurcate } from "../src/array-utils";
import { makeQuadtree } from "../src/quadtree";
import { clamp, lerp, unlerp } from "../src/interpolation";
import { spatialHashTable, SpatialHashTable } from "../src/spatial-hash-table";
import {
  createCombinedRoundRobinThreadpool,
  inMainThread,
} from "../src/threadpool";
import { simpleProgressBar } from "../src/ui/progress-bar";
import {
  addVertex,
  createGraph,
  createGraphFromData,
  findEndpoint,
  getConnectedComponents,
  getDepthFirstTraversalOrder,
} from "../src/graph";
import { download } from "../src/download";
import { bezierAdaptive } from "../src/curve/bezierify";
import { quadraticCurveToPath } from "../src/curve/quadratic-curve-to-svg";
import * as svgo from "svgo/browser";

type Point = { pos: Vec2; fixed: boolean; resistance: number };

type Points = Point[];
type Edge = { points: [Point, Point]; force: number };
type Edges = Edge[];

let points: Points = [];
let edges: Edges = [];

const LINE_COUNT = 1000;
const POINTS_PER_LINE = 100;

function physicsIter(points: Points, edges: Edges, push: (pt: Point) => Vec2) {
  for (const p of points) {
    if (p.fixed) continue;
    const force = push(p);
    p.pos = add2(p.pos, scale2(force, p.resistance));
  }

  for (const e of edges) {
    const offset = sub2(e.points[1].pos, e.points[0].pos);
    const dist = length2(offset);
    const dir = scale2(offset, 1 / dist);
    const force = scale2(dir, dist * e.force);
    if (!e.points[0].fixed)
      e.points[0].pos = add2(
        e.points[0].pos,
        scale2(force, e.points[0].resistance),
      );
    if (!e.points[1].fixed)
      e.points[1].pos = sub2(
        e.points[1].pos,
        scale2(force, e.points[1].resistance),
      );
  }
}

function splitLongEdges(
  points: Points,
  edges: Edges,
  threshold: number,
  maxPoints: number,
): Edges {
  const [edgesToSplit, edgesToKeep] = bifurcate(
    edges,
    (e) => length2(sub2(e.points[0].pos, e.points[1].pos)) > threshold,
  );

  const newEdges = edgesToKeep;

  if (maxPoints < points.length + edgesToSplit.length) {
    console.warn("Exceeded max point limit", maxPoints);
    return edges;
  }

  for (const edge of edgesToSplit) {
    const newPoint: Point = {
      pos: scale2(add2(edge.points[0].pos, edge.points[1].pos), 0.5),
      fixed: false,
      resistance: (edge.points[0].resistance + edge.points[1].resistance) / 2,
    };

    points.push(newPoint);

    newEdges.push({
      points: [edge.points[0], newPoint],
      force: edge.force,
    });
    newEdges.push({
      points: [newPoint, edge.points[1]],
      force: edge.force,
    });
  }

  return newEdges;
}

function waitForAnimationFrame() {
  return new Promise<number>((resolve, reject) => {
    requestAnimationFrame(resolve);
  });
}

async function drawEdges(
  edges: Edges,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  let i = 0;

  ctx.beginPath();
  for (const e of edges) {
    i++;
    ctx.moveTo(e.points[0].pos[0] * width, e.points[0].pos[1] * height);
    ctx.lineTo(e.points[1].pos[0] * width, e.points[1].pos[1] * height);
    if (i % 100000 === 99999) {
      ctx.stroke();
      await waitForAnimationFrame();
      ctx.beginPath();
    }
  }
  ctx.stroke();
}

async function getSvgPath(edges: Edges) {}

type ForceEmitter = {
  pos: Vec2;
  radMin: number;
  forceMin: number;
  radMax: number;
  forceMax: number;
  forceGamma: number;
};

const forceEmitters: SpatialHashTable<ForceEmitter> = spatialHashTable(
  { a: [-0.5, -0.5], b: [1.5, 1.5] },
  [100, 100],
  (f) => ({
    a: [f.pos[0] - f.radMax, f.pos[1] - f.radMax],
    b: [f.pos[0] + f.radMax, f.pos[1] + f.radMax],
  }),
);

function runIters(n: number) {
  for (const i in range(n)) {
    physicsIter(points, edges, (pt) => {
      let force: Vec2 = [0, 0];
      for (const f of forceEmitters.queryPoint(pt.pos)) {
        const center: Vec2 = f.pos;
        const offsetFromCenter = sub2(pt.pos, center);
        const distFromCenter = length2(offsetFromCenter);
        const directionFromCenter = scale2(
          offsetFromCenter,
          1 / distFromCenter,
        );

        const normedDist = unlerp(distFromCenter, f.radMin, f.radMax);
        const strength = lerp(
          clamp(normedDist, 0, 1) ** f.forceGamma,
          f.forceMax,
          f.forceMin,
        );

        const forceFromCenter = scale2(
          directionFromCenter,
          Math.min(0.005, (1 / 1_000_000) * strength),
        );
        force = add2(force, forceFromCenter);
      }
      return force;
    });
    edges = splitLongEdges(points, edges, (0.5 * 1) / POINTS_PER_LINE, 2000000);
  }
}

function randomlyPlaceForceEmitters(
  parameters: { pos: Vec2; size: number }[],
  forceGamma: number,
) {
  for (const f of forceEmitters.all()) {
    f.forceMax = 0;
  }

  for (const { pos, size } of parameters) {
    const radMin = size * 0.5;
    const radMax = size;

    const nearbyThreshold = radMin * 1.4;

    const nearbyEmitters = forceEmitters.queryRect({
      a: [pos[0] - nearbyThreshold, pos[1] - nearbyThreshold],
      b: [pos[0] + nearbyThreshold, pos[1] + nearbyThreshold],
    });

    let tooClose = false;

    for (const emitter of nearbyEmitters) {
      if (
        length2(sub2(emitter.pos, pos)) <
        nearbyThreshold + emitter.radMin * 1.4
      ) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) continue;

    forceEmitters.insert({
      pos,
      forceMin: 0,
      forceMax: size ** 0.3 * 1000,
      radMin,
      radMax,
      forceGamma,
    });
  }
}

function addEyeball(
  points: Points,
  edges: Edges,
  position: Vec2,
  irisRadius: number,
  pupilRadius: number,
) {
  // const COUNT = 250;
  // for (const i of smartRange(COUNT)) {
  //   const angle = i.remap(0, Math.PI * 2);
  //   const dir: Vec2 = [Math.cos(angle), Math.sin(angle)];
  //   const irisPoint = {
  //     pos: add2(position, scale2(dir, irisRadius)),
  //     fixed: false,
  //     resistance: 10000,
  //   };
  //   points.push(irisPoint);
  //   if (!i.start()) {
  //     edges.push({ points: [points.at(-2)!, points.at(-1)!], force: 0 });
  //   }
  //   if (i.end()) {
  //     edges.push({
  //       points: [points.at(-1)!, points.at(-COUNT + 0)!],
  //       force: 0,
  //     });
  //   }
  // }

  // const pupilCount = Math.floor(clamp(pupilRadius * 200000, 10, Infinity));

  // for (const i of smartRange(pupilCount)) {
  //   const factor = i.remap(0, 1) ** 0.5;

  //   const angle = factor * pupilRadius * 10000;
  //   const dir: Vec2 = [Math.cos(angle), Math.sin(angle)];
  //   const pupilPoint = {
  //     pos: add2(position, scale2(dir, pupilRadius * factor)),
  //     fixed: false,
  //     resistance: 10000,
  //   };
  //   points.push(pupilPoint);
  //   if (!i.start()) {
  //     edges.push({ points: [points.at(-2)!, points.at(-1)!], force: 0 });
  //   }
  // }

  const irisCount = Math.floor(clamp(irisRadius * 10000, 10, Infinity));

  for (const i of smartRange(irisCount)) {
    const angle = i.remap(0, Math.PI * 2);
    const dir: Vec2 = [Math.cos(angle), Math.sin(angle)];
    const mag = lerp(Math.random() > 0.5 ? 0.9 : 0.1, irisRadius, pupilRadius);
    const point = {
      pos: add2(position, scale2(dir, mag)),
      fixed: false,
      resistance: 10000,
    };
    points.push(point);
    if (!i.start()) {
      edges.push({ points: [points.at(-2)!, points.at(-1)!], force: 0 });
    }
  }
}

const HUGE = 0.1;
const BIG = 0.025;
const MEDIUM = 0.01;
const SMALL = 0.005;
const TINY = 0.002;

const threadpool = createCombinedRoundRobinThreadpool(
  () => ({
    addForceEmitters(emitters: ForceEmitter[]) {
      for (const e of emitters) {
        forceEmitters.insert(e);
      }
    },

    randomlyPlaceForceEmitters: randomlyPlaceForceEmitters,

    doFullPhysicsIter() {
      physicsIter(points, edges, (pt) => {
        let force: Vec2 = [0, 0];
        for (const f of forceEmitters.queryPoint(pt.pos)) {
          const center: Vec2 = f.pos;
          const offsetFromCenter = sub2(pt.pos, center);
          const distFromCenter = length2(offsetFromCenter);
          const directionFromCenter = scale2(
            offsetFromCenter,
            1 / distFromCenter,
          );

          const normedDist = unlerp(distFromCenter, f.radMin, f.radMax);
          const strength = lerp(
            clamp(normedDist, 0, 1) ** f.forceGamma,
            f.forceMax,
            f.forceMin,
          );

          const forceFromCenter = scale2(
            directionFromCenter,
            Math.min(0.005, (1 / 1_000_000) * strength),
          );
          force = add2(force, forceFromCenter);
        }
        return force;
      });
      edges = splitLongEdges(
        points,
        edges,
        (0.5 * 1) / POINTS_PER_LINE,
        2000000,
      );
    },

    doDryPhysicsIter() {
      physicsIter(points, edges, () => [0, 0]);
    },

    addPoints(pts: Point[]) {
      points.push(...pts);
    },

    addEdges(edg: Edge[]) {
      edges.push(...edg);
    },

    getPoints() {
      return points;
    },

    getEdges() {
      return edges;
    },

    getForceEmitters() {
      return Array.from(forceEmitters.all());
    },

    createLine(y: number, res: number) {
      smartRange(res).map((iPoint) => {
        const pos: Vec2 = [iPoint.remap(-0.1, 1.1, true), y];
        const point: Point = {
          pos,
          fixed: iPoint.start() || iPoint.end(),
          resistance: 1,
        };
        points.push(point);

        if (!iPoint.start()) {
          edges.push({
            points: [points.at(-1)!, points.at(-2)!],
            force: 0.025,
          });
        }
      });
    },

    bezierAdaptive,
  }),
  undefined,
  20,
);

function createSvgPath(path: Vec2[], sigfigs: number) {
  if (path.length === 0) return "";

  const str = (n: number) => n.toPrecision(sigfigs);

  let out = `M ${path[0][0]} ${path[0][1]} `;

  let prevPos = path[0];

  for (const pt of path.slice(1)) {
    const offset = sub2(pt, prevPos);

    const xstr = str(offset[0]);
    const ystr = str(offset[1]);

    out += `l ${xstr} ${ystr}`;

    prevPos = [prevPos[0] + Number(xstr), prevPos[1] + Number(ystr)];
  }

  return out;
}

inMainThread(async () => {
  const canvas = document.createElement("canvas");

  const ctx = canvas.getContext("2d")!;
  canvas.width = 4096;
  canvas.height = 4096;

  const nPhysicsIters = (n: number) =>
    range(n).map((e) => () => threadpool.broadcast.doFullPhysicsIter());

  const nDryPhysicsIters = (n: number) =>
    range(n).map((e) => () => threadpool.broadcast.doDryPhysicsIter());

  function addEyeballForceEmitters(
    count: number,
    sizeMin: number,
    sizeMax: number,
    forceGamma: number,
  ) {
    return () =>
      threadpool.broadcast.randomlyPlaceForceEmitters(
        range(count).map((e) => ({
          pos: [Math.random(), Math.random()],
          size: rand(sizeMin, sizeMax),
        })),
        forceGamma,
      );
  }

  await simpleProgressBar([
    "Init",
    async () => {
      await Promise.all(
        smartRange(LINE_COUNT).map(async (iLine) => {
          let linePoints: Points = [];
          let lineEdges: Edges = [];
          const y = iLine.remap(0, 1, true);
          await threadpool.send.createLine(y, POINTS_PER_LINE);
        }),
      );
    },
    "Center Eyeball",
    async () => {
      await threadpool.broadcast.addForceEmitters([
        {
          pos: [0.5, 0.5],
          forceMin: 0,
          forceMax: 1100,
          radMin: 0.1,
          radMax: 0.8,
          forceGamma: 4,
        },
      ]);
    },
    ...nPhysicsIters(100),
    "BIG-HUGE eyeballs",
    addEyeballForceEmitters(400, BIG, HUGE, 2),
    ...nPhysicsIters(100),
    "MEDIUM-BIG eyeballs",
    addEyeballForceEmitters(1000, MEDIUM, BIG, 2),
    ...nPhysicsIters(100),
    "SMALL-MEDIUM eyeballs",
    addEyeballForceEmitters(3000, SMALL, MEDIUM, 2),
    ...nPhysicsIters(100),
    // "TINY-SMALL eyeballs",
    // addEyeballForceEmitters(10000, TINY, SMALL, 2),
    // ...nPhysicsIters(100),
    "Settle",
    ...nDryPhysicsIters(100),
    "Draw On Canvas",
  ]);

  document.body.appendChild(canvas);

  const points = (await threadpool.broadcast.getPoints()).flat(1);
  const edges = (await threadpool.broadcast.getEdges()).flat(1);

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await drawEdges(edges, ctx, canvas.width, canvas.height);

  const forceEmitters = await threadpool.send.getForceEmitters();

  const graph = createGraphFromData<{ pos: Vec2 }, undefined>(
    [...new Set(edges.map((e) => e.points).flat())],
    edges.map((e) => ({ endpoints: e.points, data: undefined })),
  );

  const components = getConnectedComponents(graph);

  function createSvgElem(name: string) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  var svg = createSvgElem("svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttributeNS(null, "width", "4096");
  svg.setAttributeNS(null, "height", "4096");

  let componentsLoaded = 0;

  await Promise.all(
    components.map(async (comp) => {
      // for (const maxErr of [0.001, 0.01, 0.1, 1, 10]) {
      const path = createSvgElem("path");
      path.setAttributeNS(null, "fill", "transparent");
      path.setAttributeNS(null, "stroke", "black");

      const sequence = getDepthFirstTraversalOrder(
        comp,
        findEndpoint(comp),
      ).map((p) => scale2(p.data.pos, canvas.width));

      const bezierifiedCurve = await threadpool.send.bezierAdaptive(
        sequence,
        1,
        0.5,
        50,
      );

      path.setAttributeNS(
        null,
        "d",
        quadraticCurveToPath(bezierifiedCurve, 5, [0, 0]),
      );
      svg.appendChild(path);
      componentsLoaded++;
      console.log(componentsLoaded);
      // }
    }),
  );

  const eyeballpoints: Points = [];
  const eyeballedges: Edges = [];

  for (const e of forceEmitters) {
    const radius = e.radMin;
    addEyeball(eyeballpoints, eyeballedges, e.pos, radius, radius / 2);
    const path = createSvgElem("circle");
    path.setAttributeNS(null, "fill", "black");
    path.setAttributeNS(null, "r", ((radius * canvas.width) / 2).toString());
    path.setAttributeNS(null, "cx", (e.pos[0] * canvas.width).toString());
    path.setAttributeNS(null, "cy", (e.pos[1] * canvas.width).toString());
    svg.appendChild(path);

    const path2 = createSvgElem("circle");
    path2.setAttributeNS(null, "stroke", "black");
    path2.setAttributeNS(null, "fill", "transparent");
    path2.setAttributeNS(null, "r", ((radius * canvas.width) / 1).toString());
    path2.setAttributeNS(null, "cx", (e.pos[0] * canvas.width).toString());
    path2.setAttributeNS(null, "cy", (e.pos[1] * canvas.width).toString());
    svg.appendChild(path2);
  }

  const eyeballgraph = createGraphFromData<{ pos: Vec2 }, undefined>(
    [...new Set(eyeballedges.map((e) => e.points).flat())],
    eyeballedges.map((e) => ({ endpoints: e.points, data: undefined })),
  );

  for (const comp of getConnectedComponents(eyeballgraph)) {
    const path = createSvgElem("path");
    path.setAttributeNS(null, "fill", "transparent");
    path.setAttributeNS(null, "stroke", "black");

    const sequence = getDepthFirstTraversalOrder(comp, findEndpoint(comp)).map(
      (p) => scale2(p.data.pos, canvas.width),
    );

    path.setAttributeNS(null, "d", createSvgPath(sequence, 3));
    svg.appendChild(path);
  }

  download(
    new Blob([
      `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

` + svg.outerHTML,
    ]),

    "ISEEYOU.svg",
  );

  document.body.appendChild(svg);

  console.log(components);
});
