import { gradient2 } from "../src/curve/bezierify";
import {
  equidistantPointsOnCurve,
  variableDistancePointsOnCurve,
} from "../src/curve/points-on-curve";
import {
  addEdge,
  addVertex,
  createGraph,
  findEndpoint,
  getConnectedComponents,
  getDepthFirstTraversalOrder,
  Graph,
  graph2json,
  json2graph,
  subdivideEdges,
  subdivideEdgesAtCutsSimple,
  subdivideEdgesByDistance,
  subdivideEdgesByMaximumAngleDifference,
  Vertex,
} from "../src/graph";
import { clamp, lerp, rescale, rescaleClamped } from "../src/interpolation";
import {
  circleIntersectLine,
  closestApproachOfLineSegmentToPoint,
  getEqualAngularDivisionsOfLineSegment,
  sampleLineSegment,
} from "../src/math/intersections";
import { perlin2d, simpleRandVec2ToVec2 } from "../src/math/noise";
import {
  add2,
  cart2Polar,
  distance2,
  dot2,
  length2,
  mix2,
  mul2,
  normalize2,
  polar2Cart,
  rescale2,
  scale2,
  sub2,
  Vec2,
} from "../src/math/vector.generated";
import { id, rand, range, smartRange } from "../src/range";
import {
  Circle,
  inCircle,
  parseSpatialHashTable,
  serializeSpatialHashTable,
  SpatialHashTable,
  spatialHashTable,
} from "../src/spatial-hash-table";
import {
  createCombinedRoundRobinThreadpool,
  getPerformanceStatistics,
  inMainThread,
} from "../src/threadpool";

const POINTS_PER_LINE = 20;
let SIZE: number;
let LINE_COUNT: number;
let PUPIL_DENSITY: number;
let IRIS_DENSITY: number;
let MIN_LINE_POINT_DENSITY: number;
let MAX_LINE_POINT_DENSITY: number;

function setSize(size: number) {
  SIZE = size;
  LINE_COUNT = Math.round(SIZE / 3);
  PUPIL_DENSITY = Math.round(40_000_000 * (SIZE ** 2 / 2048 ** 2));
  IRIS_DENSITY = Math.round(35_000_000 * (SIZE ** 2 / 2048 ** 2));
  MIN_LINE_POINT_DENSITY = SIZE * 0.35;
  MAX_LINE_POINT_DENSITY = SIZE * 2.4;
}

type Eyeball = {
  irisRadius: number;
  pupilRadius: number;
  forceRadius: number;
  pos: Vec2;
  index: number;
};

type Point = { pos: Vec2; pushed: boolean; initialPos: Vec2 };
type Edge = {};

function pointDrawer(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) {
  const dims: Vec2 = [canvas.width, canvas.height];
  return {
    point(pos: Vec2) {
      return this.pointUnscaled(mul2(pos, dims));
    },
    pointUnscaled(pos: Vec2) {
      const [x, y] = pos;
      // ctx.globalCompositeOperation = "multiply";
      // ctx.beginPath();
      // ctx.arc(x, y, 15, 0, Math.PI * 2);
      // ctx.stroke();
      // ctx.fillRect(Math.floor(x) - 1, Math.floor(y), 3, 1);
      // ctx.fillRect(Math.floor(x), Math.floor(y) - 5, 1, 11);

      const OFFSET = 0.3;
      const RECTSIZE = 1;

      ctx.fillRect(x, y, RECTSIZE, RECTSIZE);

      // ctx.fillStyle = "#ff6666";
      // ctx.fillRect(x - OFFSET, y - OFFSET, RECTSIZE, RECTSIZE);
      // ctx.fillStyle = "#66ff66";
      // ctx.fillRect(x, y, RECTSIZE, RECTSIZE);
      // ctx.fillStyle = "#6666ff";
      // ctx.fillRect(x + OFFSET, y + OFFSET, RECTSIZE, RECTSIZE);
      // ctx.fillRect(Math.floor(x) - 1, Math.floor(y), 3, 1);
    },
  };
}

const tp = createCombinedRoundRobinThreadpool(
  (isMainThread: boolean) => {
    let graph: Graph<Point, Edge> = createGraph();
    let eyeballs: SpatialHashTable<Eyeball>;

    function shiftLines() {
      for (const index of range(
        Math.max(...[...eyeballs.all()].map((e) => e.index)) + 1,
      )) {
        for (const i of range(1)) {
          subdivideEdgesAtCutsSimple(
            graph,
            (edge) => {
              if (
                distance2(
                  edge.endpoints[0].data.initialPos,
                  edge.endpoints[1].data.initialPos,
                ) <
                1 / 2048
              )
                return [];

              const ebs = eyeballs.queryRect({
                a: edge.endpoints[0].data.initialPos,
                b: edge.endpoints[1].data.initialPos,
              });

              return [...ebs]
                .filter((e) => e.index === index)
                .map((e) => {
                  const seg = {
                    a: edge.endpoints[0].data.initialPos,
                    b: edge.endpoints[1].data.initialPos,
                  };

                  const tValue = closestApproachOfLineSegmentToPoint(
                    seg,
                    e.pos,
                  );
                  const distAway = distance2(
                    sampleLineSegment(seg, tValue),
                    e.pos,
                  );
                  const radiiAway = clamp(distAway / e.forceRadius, 0, 1);

                  return getEqualAngularDivisionsOfLineSegment(
                    e.pos,
                    seg,
                    Math.max(0.6 * radiiAway, 0.1),
                  );
                })
                .flat(1);
            },
            (a, b, f) => {
              const mixedPos = mix2(f, a.data.pos, b.data.pos);
              const mixedIPos = mix2(f, a.data.initialPos, b.data.initialPos);

              return {
                pushed: false,
                initialPos: mixedIPos,
                pos: mixedPos,
              };
            },
            {},
          );

          pushLines(graph, eyeballs, index);

          subdivideEdgesByMaximumAngleDifference(
            graph,
            (e) =>
              Math.atan2(
                e.endpoints[1].data.pos[1] - e.endpoints[0].data.pos[1],
                e.endpoints[1].data.pos[0] - e.endpoints[0].data.pos[0],
              ),
            (e, angle) => {
              let cutsToMake = Math.min(
                Math.floor((angle / Math.PI) * 20),
                Math.floor(
                  distance2(e.endpoints[0].data.pos, e.endpoints[1].data.pos) *
                    2048,
                ),
              );
              if (cutsToMake === 0) return undefined;
              return [
                smartRange(cutsToMake).map((e) => [{}, e.remapCenter(0, 1)]),
                {},
              ];
            },
            (a, b, f) => {
              const mixedPos = mix2(f, a.data.pos, b.data.pos);
              const mixedIPos = mix2(f, a.data.initialPos, b.data.initialPos);

              return {
                pushed: false,
                initialPos: mixedIPos,
                pos: mixedPos,
              };
            },
          );
        }
        pushLines(graph, eyeballs, index);
        [...graph.vertices.values()].forEach((v) => {
          v.data.initialPos = v.data.pos;
        });
      }
    }

    return {
      setSize(size: number) {
        setSize(size);
      },
      setGraph(g: Graph<Point, Edge>) {
        graph = g;
      },
      setEyeballs(ebs: SpatialHashTable<Eyeball>) {
        eyeballs = ebs;
      },
      shiftLines() {
        shiftLines();
      },
      getGraph() {
        return graph;
      },
      shiftGraph(g: Graph<Point, Edge>) {
        graph = g;
        shiftLines();
        return graph;
      },
      drawEyeballOffscreen(eyeball: Eyeball, originalCanvasDims: Vec2) {
        const eyeballSize = eyeball.irisRadius;
        const canvasDims = scale2(originalCanvasDims, eyeballSize * 2);
        const canvas: OffscreenCanvas | HTMLCanvasElement = isMainThread
          ? (document.getElementById("canvas")! as HTMLCanvasElement)
          : new OffscreenCanvas(
              Math.ceil(canvasDims[0]),
              Math.ceil(canvasDims[1]),
            );

        const ctx: CanvasRenderingContext2D = canvas.getContext(
          "2d",
        )! as CanvasRenderingContext2D;
        const draw = pointDrawer(canvas, ctx);

        const e = eyeball;

        const eyePos: Vec2 = isMainThread
          ? eyeball.pos
          : [eyeballSize, eyeballSize];
        {
          ctx.fillStyle = "black";

          const pointCount = Math.floor(PUPIL_DENSITY * e.pupilRadius ** 2);

          for (const i of range(pointCount)) {
            const randomPointInCircle: Vec2 = [
              rand(eyePos[0] - e.pupilRadius, eyePos[0] + e.pupilRadius),
              rand(eyePos[1] - e.pupilRadius, eyePos[1] + e.pupilRadius),
            ];
            if (distance2(randomPointInCircle, eyePos) > e.pupilRadius)
              continue;

            draw.pointUnscaled(
              scale2(randomPointInCircle, originalCanvasDims[0]),
            );
          }
        }

        {
          ctx.fillStyle = "black";

          const pointCount = Math.floor(IRIS_DENSITY * e.irisRadius ** 2);

          const seed: Vec2 = [Math.random() * 100, Math.random() * 100];

          const randgen = (v: Vec2) => simpleRandVec2ToVec2(add2(v, seed));

          for (const i of range(pointCount)) {
            const randomPointInCircle: Vec2 = [
              rand(-e.irisRadius, e.irisRadius),
              rand(-e.irisRadius, e.irisRadius),
            ];

            const [r, theta] = cart2Polar(randomPointInCircle);

            if (
              r > e.irisRadius * rand(0.9, 1) ||
              r < e.pupilRadius ||
              perlin2d([(r / e.irisRadius) * 3.5, theta * 20], randgen) >
                rand(-0.2, 0.2) ||
              distance2(
                [rescale(r, e.pupilRadius, e.irisRadius, 0, 1), theta / 2],
                [0.5, -Math.PI / 4 / 2],
              ) < rand(0.15, 0.36)
            )
              continue;

            draw.pointUnscaled(
              scale2(add2(randomPointInCircle, eyePos), originalCanvasDims[0]),
            );
          }
        }

        if (isMainThread) return;

        return {
          drawAt: mul2(
            sub2(e.pos, [eyeballSize, eyeballSize]),
            originalCanvasDims,
          ),
          image: (canvas as OffscreenCanvas).transferToImageBitmap(),
        };
      },
    };
  },
  undefined,
  undefined,
  {
    drawEyeballOffscreen: {
      transferRetVal(r) {
        return r ? [r.image] : [];
      },
      runMode(args) {
        return args[0].irisRadius > 0.04 ? "worker" : "main";
      },
    },
    shiftGraph: {
      serializeArgs(args) {
        return graph2json(args[0]);
      },
      parseArgs(args) {
        return [json2graph(args)];
      },
      serializeRetVal(r) {
        return graph2json(r);
      },
      parseRetVal(r) {
        return json2graph(r);
      },
    },
    getGraph: {
      serializeRetVal(r) {
        return graph2json(r);
      },
      parseRetVal(r) {
        return json2graph(r);
      },
    },
    setGraph: {
      serializeArgs(args) {
        return graph2json(args[0]);
      },
      parseArgs(args) {
        return [json2graph(args)];
      },
    },
    setEyeballs: {
      serializeArgs(ebs) {
        return serializeSpatialHashTable(ebs[0]);
      },
      parseArgs(ebs) {
        return [parseSpatialHashTable<Eyeball>(ebs, getEyeballBounds)];
      },
    },
  },
);

function circle(ctx: CanvasRenderingContext2D, c: Circle) {
  ctx.moveTo(c.center[0], c.center[1]);
  ctx.arc(c.center[0], c.center[1], c.radius, 0, Math.PI * 2);
}

function pushLines(
  graph: Graph<Point, Edge>,
  eyeballs: SpatialHashTable<Eyeball>,
  index: number,
) {
  for (const vert of graph.vertices) {
    const eyesInRange = inCircle(
      eyeballs,
      { center: vert.data.initialPos, radius: 0 },
      (e) => ({
        radius: e.forceRadius,
        center: e.pos,
      }),
    );

    let offset: Vec2 = [0, 0];

    for (const e of eyesInRange) {
      if (e.index !== index) continue;
      const offsetToEye = sub2(vert.data.initialPos, e.pos);
      const distToEye = length2(offsetToEye);
      const pushFactor = rescale(distToEye, 0, e.forceRadius, 1, 0);
      const pushMag = pushFactor ** 2 * e.forceRadius * 0.3;
      const push = rescale2(offsetToEye, pushMag);
      offset = add2(offset, mul2(push, [1.0, 0.75]));
      vert.data.pushed = true;
    }
    vert.data.pos = add2(vert.data.initialPos, offset);
  }
}

function getEyeballBounds(e: Eyeball) {
  const maxRadius = Math.max(e.forceRadius, e.irisRadius, e.pupilRadius);
  return {
    a: sub2(e.pos, [maxRadius, maxRadius]),
    b: add2(e.pos, [maxRadius, maxRadius]),
  };
}

function tryInsertEyeball() {}

function addEyeballs(
  eyeballs: SpatialHashTable<Eyeball>,
  tryCount: number,
  logMax: number,
  logMin: number,
  index: number,
) {
  for (const i of smartRange(tryCount)) {
    const radius = Math.pow(10, i.remap(logMax, logMin));
    const center: Vec2 = sub2([Math.random(), Math.random()], [0.5, 0.5]);

    const MARGIN = 1 + Math.random() ** 0.5 * 0.2;

    if (
      inCircle(eyeballs, { radius: radius * MARGIN, center }, (t) => ({
        radius: t.irisRadius * 1.4 * MARGIN,
        center: t.pos,
      })).size > 0
    ) {
      continue;
    }

    eyeballs.insert({
      pos: center,
      irisRadius: radius * 0.6,
      pupilRadius: radius * 0.3,
      forceRadius: radius * 3,
      index,
    });
  }
}

function tileEyeballs(eyeballs: SpatialHashTable<Eyeball>) {
  const balls = eyeballs.all();
  for (const b of balls) {
    for (const offsetVector of [
      [1, 0],
      [0, 1],
      [1, 1],
    ] as Vec2[]) {
      eyeballs.insert({
        ...b,
        pos: add2(b.pos, offsetVector),
      });
    }
  }
}

function waitForAnimationFrame() {
  return new Promise((resolve, reject) => {
    requestAnimationFrame(resolve);
  });
}

const frames: (() => any)[] = [];
function enqueueAnimationFrame<T>(process: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    frames.push(async () => {
      const res = await process();
      resolve(res);
    });
  });
}

async function loop() {
  let startTime = Date.now();
  while (Date.now() - startTime < 1000 / 60 && frames.length > 0) {
    const frame = frames.shift();
    if (frame) await frame();
  }
  requestAnimationFrame(loop);
}

function lookupEyeballForceField(
  ebs: SpatialHashTable<Eyeball>,
  position: Vec2,
  index: number | undefined,
) {
  const eyesInRange = inCircle(ebs, { center: position, radius: 0 }, (e) => ({
    radius: e.forceRadius,
    center: e.pos,
  }));

  let offset: Vec2 = [0, 0];

  for (const e of eyesInRange) {
    if (index !== undefined && e.index !== index) continue;
    const offsetToEye = sub2(position, e.pos);
    const distToEye = length2(offsetToEye);
    const pushFactor = rescale(distToEye, 0, e.forceRadius, 1, 0);
    const pushMag = pushFactor ** 2 * e.forceRadius * 0.3;
    const push = rescale2(offsetToEye, pushMag);
    offset = add2(offset, mul2(push, [1.0, 0.75]));
  }

  return offset;
}

loop();

inMainThread(async () => {
  const size = Math.round(window.innerWidth * window.devicePixelRatio);
  setSize(size);
  await tp.broadcast.setSize(size);

  const mainThreadEyeballs = spatialHashTable<Eyeball>(
    {
      a: [-0.3, -0.3],
      b: [1.3, 1.3],
    },
    [100, 100],
    getEyeballBounds,
  );

  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  document.body.appendChild(canvas);
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  const draw = pointDrawer(canvas, ctx);

  addEyeballs(mainThreadEyeballs, 100, -1.1, -1.4, 0);
  addEyeballs(mainThreadEyeballs, 1000, -1.4, -1.7, 1);
  addEyeballs(mainThreadEyeballs, 10000, -1.7, -2.0, 2);
  addEyeballs(mainThreadEyeballs, 40000, -2.0, -2.7, 3);
  tileEyeballs(mainThreadEyeballs);

  await tp.broadcast.setEyeballs(mainThreadEyeballs);

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await Promise.all([
    Promise.all(
      [...mainThreadEyeballs.all()].map(async (e) => {
        await enqueueAnimationFrame(async () => {
          const r = await tp.send.drawEyeballOffscreen(e, [
            canvas.width,
            canvas.height,
          ]);
          if (r) {
            ctx.drawImage(
              r.image,
              Math.floor(r.drawAt[0]),
              Math.floor(r.drawAt[1]),
            );
          }
        });
      }),
    ),

    Promise.all(
      smartRange(Math.ceil(LINE_COUNT)).map(async (line) => {
        const graph = createGraph<Point, Edge>();

        smartRange(POINTS_PER_LINE).reduce<Vertex<{ pos: Vec2 }, {}> | null>(
          (prev, point) => {
            const pos: Vec2 = [
              point.remap(-0.1, 1.1, true),
              line.remap(-0.1, 1.1),
            ];
            const pt = addVertex<Point, Edge>(graph, {
              pos,
              initialPos: pos,
              pushed: false,
            });
            if (!point.start() && prev) {
              addEdge(graph, [prev, pt], {});
            }

            return pt;
          },
          null,
        );

        const components = getConnectedComponents(
          await tp.send.shiftGraph(graph),
        );

        await enqueueAnimationFrame(async () => {
          ctx.fillStyle = "black";
          for (const comp of components) {
            const path = getDepthFirstTraversalOrder(comp, findEndpoint(comp));

            const toDraw = variableDistancePointsOnCurve(
              path.map((e) => e.data.pos),
              (p) => {
                let d = dot2(
                  normalize2(
                    gradient2(
                      (v) =>
                        length2(
                          lookupEyeballForceField(
                            mainThreadEyeballs,
                            v,
                            undefined,
                          ),
                        ),
                      p,
                      0.001,
                    ),
                  ),
                  normalize2([1, -1]),
                );

                if (isNaN(d)) d = 0;

                const normd = clamp(d + rand(-0.5, 0.5), 0, 1);

                return lerp(
                  normd,
                  1 / MAX_LINE_POINT_DENSITY,
                  1 / MIN_LINE_POINT_DENSITY,
                );
              },
            );

            console.log(toDraw.length);

            ctx.beginPath();
            for (const e of toDraw) {
              const pos = e;
              draw.pointUnscaled(
                add2(scale2(pos, canvas.width), [rand(-1, 1), rand(-1, 1)]),
              );
            }
            ctx.stroke();
          }
        });
      }),
    ),
  ]);

  console.log(
    "PERF",
    getPerformanceStatistics(await tp.getCurrentPerformanceRecords()),
  );
});
