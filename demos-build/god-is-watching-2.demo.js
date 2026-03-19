(() => {
  // src/interpolation.ts
  function lerp(x, a, b) {
    return a * (1 - x) + b * x;
  }
  function unlerp(x, a, b) {
    return (x - a) / (b - a);
  }
  function rescale(x, a1, b1, a2, b2) {
    return lerp(unlerp(x, a1, b1), a2, b2);
  }
  function rescaleClamped(x, a1, b1, a2, b2) {
    return lerp(clamp(unlerp(x, a1, b1), 0, 1), a2, b2);
  }
  function clamp(x, lo, hi) {
    return Math.max(Math.min(x, hi), lo);
  }
  function unclampedSmoothstep(x) {
    return x * x * (3 - 2 * x);
  }
  function smoothstep(x) {
    return unclampedSmoothstep(clamp(x, 0, 1));
  }

  // src/math/vector.generated.ts
  function cart2Polar(a) {
    return [length2(a), Math.atan2(a[1], a[0])];
  }
  function pointTo(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }
  function add2(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
  }
  function mul2(a, b) {
    return [a[0] * b[0], a[1] * b[1]];
  }
  function sub2(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }
  function normalize2(a) {
    return scale2(a, 1 / Math.sqrt(dot2(a, a)));
  }
  function length2(a) {
    return Math.sqrt(dot2(a, a));
  }
  function distance2(a, b) {
    return length2(sub2(a, b));
  }
  function mix2(a, b, c) {
    return add2(b, scale2(sub2(c, b), a));
  }
  function rescale2(a, b) {
    return scale2(normalize2(a), b);
  }
  function sum2(a) {
    return a[0] + a[1];
  }
  function dot2(a, b) {
    return sum2(mul2(a, b));
  }
  function scale2(a, b) {
    return [a[0] * b, a[1] * b];
  }

  // src/curve/bezierify.ts
  function gradient2(fn, pos, diff) {
    const a = fn(pos);
    const b = fn(add2(pos, [diff, 0]));
    const c = fn(add2(pos, [0, diff]));
    return [(a - b) / diff, (a - c) / diff];
  }

  // src/curve/points-on-curve.ts
  function variableDistancePointsOnCurve(curve, nextDistance) {
    if (curve.length === 0) return [];
    const outPoints = [curve[0]];
    let interval = nextDistance(curve[0]);
    let accumDist = 0;
    for (let i = 0; i < curve.length - 1; i++) {
      const prevPoint = curve[i];
      const currPoint = curve[i + 1];
      const currLineDist = distance2(prevPoint, currPoint);
      const initLength = interval - accumDist % interval;
      accumDist += currLineDist;
      const newPointCount = Math.floor(accumDist / interval);
      let distAcross = initLength;
      while (accumDist > interval) {
        outPoints.push(mix2(distAcross / currLineDist, prevPoint, currPoint));
        accumDist -= interval;
        interval = nextDistance(outPoints.at(-1));
        distAcross += interval;
      }
    }
    return outPoints;
  }

  // src/range.ts
  function range(hi) {
    let arr = [];
    for (let i = 0; i < hi && i < 1e7; i++) {
      arr.push(i);
    }
    return arr;
  }
  function smartRangeMap(n, cb) {
    const a = range(n);
    const res1 = a.map((i, index, arr) => {
      return {
        remap(lo, hi, inclEnd) {
          return i / (inclEnd ? n - 1 : n) * (hi - lo) + lo;
        },
        remapCenter(lo, hi) {
          return (i + 1) / (n + 1) * (hi - lo) + lo;
        },
        segment(lo, hi) {
          return [i / n * (hi - lo) + lo, (i + 1) / n * (hi - lo) + lo];
        },
        slidingWindow(arr2) {
          return [arr2[i], arr2[i + 1]];
        },
        randkf() {
          if (i === 0) return 0;
          if (i === n - 1) return 100;
          const lo = i / (n - 2) * 100;
          const hi = (i + 1) / (n - 2) * 100;
          return rand(lo, hi);
        },
        get(arr2) {
          return arr2[i];
        },
        i,
        next: i + 1,
        end: () => i === n - 1,
        start: () => i === 0
      };
    });
    const res = res1.map(cb);
    return res;
  }
  function smartRange(n) {
    return smartRangeMap(n, id);
  }
  function id(x) {
    return x;
  }
  function rand(lo, hi, random) {
    if (!random) random = () => Math.random();
    return random() * (hi - lo) + lo;
  }

  // src/graph.ts
  function createGraph() {
    return {
      vertices: /* @__PURE__ */ new Set(),
      edges: /* @__PURE__ */ new Set()
    };
  }
  function addVertex(graph, data) {
    const vertex = {
      data,
      incoming: /* @__PURE__ */ new Set(),
      outgoing: /* @__PURE__ */ new Set()
    };
    graph.vertices.add(vertex);
    return vertex;
  }
  function addEdge(graph, endpoints, data) {
    const edge = {
      data,
      endpoints
    };
    endpoints[0].outgoing.add(edge);
    endpoints[1].incoming.add(edge);
    graph.edges.add(edge);
    return edge;
  }
  function getConnectedComponents(graph) {
    const components = [];
    const vertsRemaining = new Set(graph.vertices);
    while (vertsRemaining.size > 0) {
      const foundVertices = /* @__PURE__ */ new Set();
      const foundEdges = /* @__PURE__ */ new Set();
      let queue = [vertsRemaining.values().next().value];
      while (queue.length > 0) {
        const vert = queue.shift();
        vertsRemaining.delete(vert);
        foundVertices.add(vert);
        for (const edge of vert.outgoing) {
          foundEdges.add(edge);
          if (!foundVertices.has(edge.endpoints[1])) {
            queue.push(edge.endpoints[1]);
          }
          foundVertices.add(edge.endpoints[1]);
        }
        for (const edge of vert.incoming) {
          foundEdges.add(edge);
          if (!foundVertices.has(edge.endpoints[0])) {
            queue.push(edge.endpoints[0]);
          }
          foundVertices.add(edge.endpoints[0]);
        }
      }
      components.push({
        vertices: foundVertices,
        edges: foundEdges
      });
    }
    return components;
  }
  function findEndpoint(graph) {
    for (const v of graph.vertices) {
      if (v.incoming.size + v.outgoing.size === 1) return v;
    }
    return void 0;
  }
  function getDepthFirstTraversalOrder(graph, startPoint) {
    const order = [];
    const foundVertices = /* @__PURE__ */ new Set();
    let stack = [
      startPoint ?? graph.vertices.values().next().value
    ];
    if (!stack[0]) return [];
    foundVertices.add(stack[0]);
    while (stack.length > 0) {
      const vertex = stack.pop();
      order.push(vertex);
      for (const edge of vertex.outgoing) {
        if (foundVertices.has(edge.endpoints[1])) {
          continue;
        }
        stack.push(edge.endpoints[1]);
        foundVertices.add(edge.endpoints[1]);
      }
      for (const edge of vertex.incoming) {
        if (foundVertices.has(edge.endpoints[0])) {
          continue;
        }
        stack.push(edge.endpoints[0]);
        foundVertices.add(edge.endpoints[0]);
      }
    }
    return order;
  }
  function subdivideEdges(graph, getAdjoiningVertices) {
    for (const edge of [...graph.edges]) {
      const adjoiningElements = getAdjoiningVertices(edge);
      if (!adjoiningElements) continue;
      const adjoiningVertices = adjoiningElements[0].map(
        (v) => addVertex(graph, v[1])
      );
      const adjoiningEdgeData = adjoiningElements[0].map((v) => v[0]).concat(adjoiningElements[1]);
      const starts = [edge.endpoints[0], ...adjoiningVertices];
      const ends = [...adjoiningVertices, edge.endpoints[1]];
      for (let i = 0; i < starts.length; i++) {
        const endpoints = [starts[i], ends[i]];
        addEdge(graph, endpoints, adjoiningEdgeData[i]);
      }
      graph.edges.delete(edge);
    }
  }
  function subdivideEdgesAtCuts(graph, getEdgeCuts, getVertexAlongCut) {
    subdivideEdges(graph, (edge) => {
      const cuts = getEdgeCuts(edge);
      if (!cuts) return void 0;
      return [
        cuts[0].map((c) => [
          c[0],
          getVertexAlongCut(edge.endpoints[0], edge.endpoints[1], c[1])
        ]),
        cuts[1]
      ];
    });
  }
  function subdivideEdgesAtCutsSimple(graph, getEdgeCuts, getVertexAlongCut, defaultEdge) {
    subdivideEdgesAtCuts(
      graph,
      (e) => {
        return [
          getEdgeCuts(e).filter((e2) => e2 < 1 && e2 > 0).sort((a, b) => a - b).map((e2) => [defaultEdge, e2]),
          defaultEdge
        ];
      },
      getVertexAlongCut
    );
  }
  function incidentEdges(v) {
    return /* @__PURE__ */ new Set([...v.incoming, ...v.outgoing]);
  }
  function compareAngle(a, b) {
    return Math.min(
      Math.abs(a - b),
      Math.abs(a - b + Math.PI * 2),
      Math.abs(a - b - Math.PI * 2)
    );
  }
  function getMaximumAngleDifference(edge, getAngle) {
    const myAngle = getAngle(edge);
    const edges = [
      ...incidentEdges(edge.endpoints[0]),
      ...incidentEdges(edge.endpoints[1])
    ];
    const maxAngle = Math.max(
      ...edges.map((e) => compareAngle(myAngle, getAngle(e)))
    );
    return maxAngle;
  }
  function subdivideEdgesByMaximumAngleDifference(graph, getAngle, subdivideBy, getVertexAlongCut) {
    subdivideEdgesAtCuts(
      graph,
      (edge) => {
        const maxAngle = getMaximumAngleDifference(edge, getAngle);
        return subdivideBy(edge, maxAngle);
      },
      getVertexAlongCut
    );
  }
  function graph2json(graph, serializeVertex, serializeEdge) {
    let index = 0;
    if (!serializeVertex) serializeVertex = id;
    if (!serializeEdge) serializeEdge = id;
    const vertexIndexMap = /* @__PURE__ */ new Map();
    let json = {
      vertices: [],
      edges: []
    };
    for (const v of graph.vertices) {
      vertexIndexMap.set(v, index);
      json.vertices.push(serializeVertex(v.data));
      index++;
    }
    for (const e of graph.edges) {
      json.edges.push({
        endpoints: [
          vertexIndexMap.get(e.endpoints[0]),
          vertexIndexMap.get(e.endpoints[1])
        ],
        data: serializeEdge(e.data)
      });
    }
    return json;
  }
  function json2graph(json, parseVertex, parseEdge) {
    if (!parseVertex) parseVertex = id;
    if (!parseEdge) parseEdge = id;
    const graph = createGraph();
    let vertexList = [];
    for (const v of json.vertices)
      vertexList.push(addVertex(graph, parseVertex(v)));
    for (const e of json.edges) {
      addEdge(
        graph,
        [vertexList[e.endpoints[0]], vertexList[e.endpoints[1]]],
        parseEdge(e.data)
      );
    }
    return graph;
  }

  // src/math/intersections.ts
  function lineIntersectLine(a, b) {
    const ax = a.a[0];
    const ay = a.a[1];
    const bx = a.b[0];
    const by = a.b[1];
    const cx = b.a[0];
    const cy = b.a[1];
    const dx = b.b[0];
    const dy = b.b[1];
    return ((bx - ax) * (ay - cy) + (by - ay) * (cx - ax)) / ((bx - ax) * (dy - cy) - (by - ay) * (dx - cx));
  }
  function rayIntersectLine(ray, b) {
    return lineIntersectLine(
      {
        a: ray.center,
        b: add2(ray.center, [Math.cos(ray.dir), Math.sin(ray.dir)])
      },
      b
    );
  }
  function getSmallestAngleDifference(a, b) {
    const minDiff = Math.min(
      Math.abs(a - b),
      Math.abs(a - b + Math.PI * 2),
      Math.abs(a - b - Math.PI * 2)
    );
    const lowest = Math.min(a, b);
    return [lowest, lowest + minDiff];
  }
  function getEqualAngularDivisionsOfLineSegment(center, b, interval) {
    const [angle1, angle2] = getSmallestAngleDifference(
      pointTo(center, b.a),
      pointTo(center, b.b)
    );
    const truncatedAngle1 = Math.ceil(angle1 / interval) * interval;
    let tValues = [];
    for (let i = truncatedAngle1; i < angle2; i += interval) {
      tValues.push(
        rayIntersectLine(
          {
            center,
            dir: i
          },
          b
        )
      );
    }
    return tValues;
  }
  function closestApproachOfLineSegmentToPoint(l, pt) {
    const ax = l.a[0];
    const ay = l.a[1];
    const bx = l.b[0];
    const by = l.b[1];
    const cx = pt[0];
    const cy = pt[1];
    return (-(bx - ax) * (ax - cx) - (by - ay) * (ay - cy)) / ((bx - ax) ** 2 + (by - ay) ** 2);
  }
  function sampleLineSegment(l, t) {
    return mix2(t, l.a, l.b);
  }

  // src/math/noise.ts
  function fract(x) {
    return x - Math.floor(x);
  }
  function simpleRandVec2ToFloat(co) {
    return fract(Math.sin(dot2(co, [12.9898, 78.233])) * 43758.5453);
  }
  function simpleRandVec2ToVec2(co) {
    return [simpleRandVec2ToFloat(co), simpleRandVec2ToFloat([-co[0], -co[1]])];
  }
  function perlin2d(p, randVec2 = simpleRandVec2ToVec2) {
    const fp = [Math.floor(p[0]), Math.floor(p[1])];
    const v1 = normalize2(sub2(randVec2(fp), [0.5, 0.5]));
    const v2 = normalize2(sub2(randVec2(add2(fp, [1, 0])), [0.5, 0.5]));
    const v3 = normalize2(sub2(randVec2(add2(fp, [0, 1])), [0.5, 0.5]));
    const v4 = normalize2(sub2(randVec2(add2(fp, [1, 1])), [0.5, 0.5]));
    const o1 = sub2(p, fp);
    const o2 = sub2(o1, [1, 0]);
    const o3 = sub2(o1, [0, 1]);
    const o4 = sub2(o1, [1, 1]);
    const d1 = dot2(v1, o1);
    const d2 = dot2(v2, o2);
    const d3 = dot2(v3, o3);
    const d4 = dot2(v4, o4);
    const h1 = lerp(smoothstep(p[0] - fp[0]), d1, d2);
    const h2 = lerp(smoothstep(p[0] - fp[0]), d3, d4);
    return lerp(smoothstep(p[1] - fp[1]), h1, h2);
  }

  // src/spatial-hash-table.ts
  function spatialHashTable(htBounds, resolution, getBounds) {
    let objects = /* @__PURE__ */ new Map();
    let buckets = range(resolution[0] * resolution[1]).map((e) => /* @__PURE__ */ new Set());
    function getBucketIndexes(bounds) {
      const bucketXStart = Math.floor(
        rescaleClamped(
          bounds.a[0],
          htBounds.a[0],
          htBounds.b[0],
          0,
          resolution[0] - 1
        )
      );
      const bucketXEnd = Math.ceil(
        rescaleClamped(
          bounds.b[0],
          htBounds.a[0],
          htBounds.b[0],
          0,
          resolution[0]
        )
      );
      const bucketYStart = Math.floor(
        rescaleClamped(
          bounds.a[1],
          htBounds.a[1],
          htBounds.b[1],
          0,
          resolution[1] - 1
        )
      );
      const bucketYEnd = Math.ceil(
        rescaleClamped(
          bounds.b[1],
          htBounds.a[1],
          htBounds.b[1],
          0,
          resolution[1]
        )
      );
      const indexes = [];
      for (let x = bucketXStart; x < Math.max(bucketXEnd, bucketXStart + 1); x++) {
        for (let y = bucketYStart; y < Math.max(bucketYEnd, bucketYStart + 1); y++) {
          indexes.push(x + y * resolution[0]);
        }
      }
      return indexes;
    }
    return {
      objects,
      buckets,
      resolution,
      getBounds,
      bounds: htBounds,
      insert(t) {
        const indexes = getBucketIndexes(getBounds(t));
        for (const i of indexes) {
          buckets[i].add(t);
        }
        objects.set(t, { buckets: indexes });
      },
      delete(t) {
        const obj = objects.get(t);
        if (!obj) return false;
        for (const b of obj.buckets) {
          buckets[b].delete(t);
        }
        objects.delete(t);
        return true;
      },
      queryRect(r) {
        const queryBuckets = getBucketIndexes(r);
        const output = /* @__PURE__ */ new Set();
        for (const b of queryBuckets) {
          for (const t of buckets[b]) {
            output.add(t);
          }
        }
        return output;
      },
      queryPoint(r) {
        return this.queryRect({
          a: r,
          b: r
        });
      },
      all() {
        return new Set(objects.keys());
      },
      setObjects(o) {
        this.objects = o;
        objects = o;
      },
      setBuckets(b) {
        this.buckets = buckets;
        buckets = b;
      }
    };
  }
  function inCircle(sht, c, getObjectCircle) {
    const rectResult = sht.queryRect({
      a: [c.center[0] - c.radius, c.center[1] - c.radius],
      b: [c.center[0] + c.radius, c.center[1] + c.radius]
    });
    return new Set(
      Array.from(rectResult.values()).filter((e) => {
        const objectCircle = getObjectCircle(e);
        return distance2(objectCircle.center, c.center) < objectCircle.radius + c.radius;
      })
    );
  }
  function serializeSpatialHashTable(sht, serializeItem) {
    if (!serializeItem) {
      return {
        // @ts-expect-error
        buckets: sht.buckets,
        resolution: sht.resolution,
        bounds: sht.bounds,
        // @ts-expect-error
        objects: sht.objects
      };
    }
    const serializedObjects = new Map(
      [...sht.objects].map(([k, v]) => [
        k,
        { serialized: serializeItem(k), v }
      ])
    );
    const ssht = {
      buckets: sht.buckets.map(
        (b) => new Set([...b].map((i) => serializedObjects.get(i)?.serialized))
      ),
      resolution: sht.resolution,
      bounds: sht.bounds,
      objects: new Map(
        [...sht.objects].map(([k, v]) => [
          serializedObjects.get(k).serialized,
          v
        ])
      )
    };
    return ssht;
  }
  function parseSpatialHashTable(ssht, getBounds, parseItem) {
    if (!parseItem) {
      const sht = spatialHashTable(ssht.bounds, ssht.resolution, getBounds);
      sht.setBuckets(ssht.buckets);
      sht.setObjects(ssht.objects);
      return sht;
    }
    const parsedObjects = new Map(
      [...ssht.objects].map(([k, v]) => [k, { parsed: parseItem(k), v }])
    );
    {
      const sht = spatialHashTable(ssht.bounds, ssht.resolution, getBounds);
      sht.setBuckets(
        ssht.buckets.map(
          (b) => new Set([...b].map((i) => parsedObjects.get(i)?.parsed))
        )
      );
      sht.setObjects(
        new Map(
          [...ssht.objects].map(([k, v]) => [parsedObjects.get(k).parsed, v])
        )
      );
      return sht;
    }
  }

  // src/array-utils.ts
  function groupBy(arr, getGroup) {
    const groups = /* @__PURE__ */ new Map();
    for (const entry of arr) {
      const groupName = getGroup(entry);
      let group = groups.get(groupName) ?? [];
      group.push(entry);
      groups.set(groupName, group);
    }
    return groups;
  }

  // src/threadpool.ts
  function getPerformanceStatistics(records) {
    return Object.fromEntries(
      Array.from(groupBy(records, (g) => g.name).entries()).map(([name, v]) => {
        const totalRuntime = v.reduce((prev, curr) => prev + curr.runtime, 0) / v.length;
        const invocationCount = v.length;
        return [
          name,
          {
            totalRuntime,
            invocationCount,
            averageRuntime: totalRuntime / invocationCount,
            worstCaseRuntime: v.reduce(
              (prev, curr) => Math.max(prev, curr.runtime),
              0
            ),
            bestCaseRuntime: v.reduce(
              (prev, curr) => Math.min(prev, curr.runtime),
              0
            )
          }
        ];
      })
    );
  }
  function wrapWithPromise(t) {
    if (t instanceof Promise) {
      return t;
    }
    return Promise.resolve(t);
  }
  function createRoundRobinThreadpool(src, workerCount, serialization, t) {
    const count = workerCount ?? navigator.hardwareConcurrency;
    const performanceRecords = [];
    const workers = [];
    let nextWorker = 0;
    for (let i = 0; i < count; i++) {
      workers.push(new Worker(src));
    }
    function getNextWorker() {
      const workerChoice = nextWorker;
      nextWorker = (nextWorker + 1) % count;
      return workerChoice;
    }
    let id3 = 0;
    function sendMessageToWorkerWithResponse(prop, args, workerIndex) {
      const worker = workers[workerIndex];
      const serializationInfo = serialization?.[prop];
      const startTime = performance.now();
      const shouldRunInMain = serializationInfo?.runMode?.(args) ?? "worker";
      if (shouldRunInMain === "main") {
        if (!t)
          throw new Error(
            "If a threadpool method is to run in the main thread, its interface should be provided to the main thread!"
          );
        const res2 = t[prop](...args);
        performanceRecords.push(
          wrapWithPromise(res2).then((retval) => {
            return {
              name: prop,
              inputSize: serializationInfo?.estimateInputSize?.(args) ?? 1,
              runtime: performance.now() - startTime,
              metadata: serializationInfo?.getRuntimeMetadata?.(args, retval),
              thread: { type: "main" }
            };
          })
        );
        return res2;
      }
      const res = new Promise(async (resolve, reject) => {
        const myid = id3;
        id3++;
        const onResponse = async (e) => {
          if (e.data.id !== myid) return;
          worker.removeEventListener("message", onResponse);
          const parseRetVal = serialization?.[prop]?.parseRetVal ?? ((x) => x);
          resolve(await parseRetVal(e.data.returnValue));
        };
        worker.addEventListener("message", onResponse);
        const serializeArgs = serialization?.[prop]?.serializeArgs ?? ((x) => x);
        worker.postMessage(
          {
            type: prop,
            args: await serializeArgs(args),
            id: myid
          },
          serialization?.[prop]?.transferArgs?.(args) ?? []
        );
      });
      performanceRecords.push(
        res.then((retval) => {
          return {
            name: prop,
            inputSize: serializationInfo?.estimateInputSize?.(args) ?? 1,
            runtime: performance.now() - startTime,
            metadata: serializationInfo?.getRuntimeMetadata?.(args, retval),
            thread: { type: "worker", workerId: workerIndex }
          };
        })
      );
      return res;
    }
    return {
      threadCount: count,
      getCurrentPerformanceRecords() {
        return Promise.all(performanceRecords);
      },
      send: new Proxy({}, {
        get(i, prop) {
          return async (...args) => {
            const nextWorker2 = getNextWorker();
            return sendMessageToWorkerWithResponse(prop, args, nextWorker2);
          };
        }
      }),
      sendToThread: (threadIndex) => new Proxy({}, {
        get(i, prop) {
          return async (...args) => {
            return sendMessageToWorkerWithResponse(prop, args, threadIndex);
          };
        }
      }),
      broadcast: new Proxy({}, {
        get(i, prop) {
          return async (...args) => {
            return await Promise.all(
              workers.map(
                (w, i2) => sendMessageToWorkerWithResponse(prop, args, i2)
              )
            );
          };
        }
      })
    };
  }
  function createRoundRobinThread(t, serialization) {
    self.addEventListener("message", async (e) => {
      const parseArgs = serialization?.[e.data.type]?.parseArgs ?? id;
      const args = await parseArgs(e.data.args);
      const resp = await t[e.data.type](...args);
      const serializeReturnValue = serialization?.[e.data.type]?.serializeRetVal ?? id;
      postMessage(
        {
          returnValue: await serializeReturnValue(resp),
          id: e.data.id
        },
        // @ts-expect-error
        serialization?.[e.data.type]?.transferRetVal?.(resp) ?? []
      );
    });
  }
  function createCombinedRoundRobinThreadpool(getInterface, src, workerCount, serialization) {
    if (self.WorkerGlobalScope) {
      createRoundRobinThread(getInterface(false), serialization);
      return;
    } else {
      return createRoundRobinThreadpool(
        src ?? document.currentScript.src,
        workerCount,
        serialization,
        getInterface(true)
      );
    }
  }
  async function inMainThread(cb) {
    if (self.WorkerGlobalScope) {
      return;
    }
    return await cb();
  }

  // demos-src/god-is-watching-2.demo.ts
  var POINTS_PER_LINE = 20;
  var SIZE;
  var LINE_COUNT;
  var PUPIL_DENSITY;
  var IRIS_DENSITY;
  var MIN_LINE_POINT_DENSITY;
  var MAX_LINE_POINT_DENSITY;
  function setSize(size) {
    SIZE = size;
    LINE_COUNT = Math.round(SIZE / 3);
    PUPIL_DENSITY = Math.round(4e7 * (SIZE ** 2 / 2048 ** 2));
    IRIS_DENSITY = Math.round(35e6 * (SIZE ** 2 / 2048 ** 2));
    MIN_LINE_POINT_DENSITY = SIZE * 0.35;
    MAX_LINE_POINT_DENSITY = SIZE * 2.4;
  }
  function pointDrawer(canvas, ctx) {
    const dims = [canvas.width, canvas.height];
    return {
      point(pos) {
        return this.pointUnscaled(mul2(pos, dims));
      },
      pointUnscaled(pos) {
        const [x, y] = pos;
        const OFFSET = 0.3;
        const RECTSIZE = 1;
        ctx.fillRect(x, y, RECTSIZE, RECTSIZE);
      }
    };
  }
  var tp = createCombinedRoundRobinThreadpool(
    (isMainThread) => {
      let graph = createGraph();
      let eyeballs;
      function shiftLines() {
        for (const index of range(
          Math.max(...[...eyeballs.all()].map((e) => e.index)) + 1
        )) {
          for (const i of range(1)) {
            subdivideEdgesAtCutsSimple(
              graph,
              (edge) => {
                if (distance2(
                  edge.endpoints[0].data.initialPos,
                  edge.endpoints[1].data.initialPos
                ) < 1 / 2048)
                  return [];
                const ebs = eyeballs.queryRect({
                  a: edge.endpoints[0].data.initialPos,
                  b: edge.endpoints[1].data.initialPos
                });
                return [...ebs].filter((e) => e.index === index).map((e) => {
                  const seg = {
                    a: edge.endpoints[0].data.initialPos,
                    b: edge.endpoints[1].data.initialPos
                  };
                  const tValue = closestApproachOfLineSegmentToPoint(
                    seg,
                    e.pos
                  );
                  const distAway = distance2(
                    sampleLineSegment(seg, tValue),
                    e.pos
                  );
                  const radiiAway = clamp(distAway / e.forceRadius, 0, 1);
                  return getEqualAngularDivisionsOfLineSegment(
                    e.pos,
                    seg,
                    Math.max(0.6 * radiiAway, 0.1)
                  );
                }).flat(1);
              },
              (a, b, f) => {
                const mixedPos = mix2(f, a.data.pos, b.data.pos);
                const mixedIPos = mix2(f, a.data.initialPos, b.data.initialPos);
                return {
                  pushed: false,
                  initialPos: mixedIPos,
                  pos: mixedPos
                };
              },
              {}
            );
            pushLines(graph, eyeballs, index);
            subdivideEdgesByMaximumAngleDifference(
              graph,
              (e) => Math.atan2(
                e.endpoints[1].data.pos[1] - e.endpoints[0].data.pos[1],
                e.endpoints[1].data.pos[0] - e.endpoints[0].data.pos[0]
              ),
              (e, angle) => {
                let cutsToMake = Math.min(
                  Math.floor(angle / Math.PI * 20),
                  Math.floor(
                    distance2(e.endpoints[0].data.pos, e.endpoints[1].data.pos) * 2048
                  )
                );
                if (cutsToMake === 0) return void 0;
                return [
                  smartRange(cutsToMake).map((e2) => [{}, e2.remapCenter(0, 1)]),
                  {}
                ];
              },
              (a, b, f) => {
                const mixedPos = mix2(f, a.data.pos, b.data.pos);
                const mixedIPos = mix2(f, a.data.initialPos, b.data.initialPos);
                return {
                  pushed: false,
                  initialPos: mixedIPos,
                  pos: mixedPos
                };
              }
            );
          }
          pushLines(graph, eyeballs, index);
          [...graph.vertices.values()].forEach((v) => {
            v.data.initialPos = v.data.pos;
          });
        }
      }
      return {
        setSize(size) {
          setSize(size);
        },
        setGraph(g) {
          graph = g;
        },
        setEyeballs(ebs) {
          eyeballs = ebs;
        },
        shiftLines() {
          shiftLines();
        },
        getGraph() {
          return graph;
        },
        shiftGraph(g) {
          graph = g;
          shiftLines();
          return graph;
        },
        drawEyeballOffscreen(eyeball, originalCanvasDims) {
          const eyeballSize = eyeball.irisRadius;
          const canvasDims = scale2(originalCanvasDims, eyeballSize * 2);
          const canvas = isMainThread ? document.getElementById("canvas") : new OffscreenCanvas(
            Math.ceil(canvasDims[0]),
            Math.ceil(canvasDims[1])
          );
          const ctx = canvas.getContext(
            "2d"
          );
          const draw = pointDrawer(canvas, ctx);
          const e = eyeball;
          const eyePos = isMainThread ? eyeball.pos : [eyeballSize, eyeballSize];
          {
            ctx.fillStyle = "black";
            const pointCount = Math.floor(PUPIL_DENSITY * e.pupilRadius ** 2);
            for (const i of range(pointCount)) {
              const randomPointInCircle = [
                rand(eyePos[0] - e.pupilRadius, eyePos[0] + e.pupilRadius),
                rand(eyePos[1] - e.pupilRadius, eyePos[1] + e.pupilRadius)
              ];
              if (distance2(randomPointInCircle, eyePos) > e.pupilRadius)
                continue;
              draw.pointUnscaled(
                scale2(randomPointInCircle, originalCanvasDims[0])
              );
            }
          }
          {
            ctx.fillStyle = "black";
            const pointCount = Math.floor(IRIS_DENSITY * e.irisRadius ** 2);
            const seed = [Math.random() * 100, Math.random() * 100];
            const randgen = (v) => simpleRandVec2ToVec2(add2(v, seed));
            for (const i of range(pointCount)) {
              const randomPointInCircle = [
                rand(-e.irisRadius, e.irisRadius),
                rand(-e.irisRadius, e.irisRadius)
              ];
              const [r, theta] = cart2Polar(randomPointInCircle);
              if (r > e.irisRadius * rand(0.9, 1) || r < e.pupilRadius || perlin2d([r / e.irisRadius * 3.5, theta * 20], randgen) > rand(-0.2, 0.2) || distance2(
                [rescale(r, e.pupilRadius, e.irisRadius, 0, 1), theta / 2],
                [0.5, -Math.PI / 4 / 2]
              ) < rand(0.15, 0.36))
                continue;
              draw.pointUnscaled(
                scale2(add2(randomPointInCircle, eyePos), originalCanvasDims[0])
              );
            }
          }
          if (isMainThread) return;
          return {
            drawAt: mul2(
              sub2(e.pos, [eyeballSize, eyeballSize]),
              originalCanvasDims
            ),
            image: canvas.transferToImageBitmap()
          };
        }
      };
    },
    void 0,
    void 0,
    {
      drawEyeballOffscreen: {
        transferRetVal(r) {
          return r ? [r.image] : [];
        },
        runMode(args) {
          return args[0].irisRadius > 0.04 ? "worker" : "main";
        }
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
        }
      },
      getGraph: {
        serializeRetVal(r) {
          return graph2json(r);
        },
        parseRetVal(r) {
          return json2graph(r);
        }
      },
      setGraph: {
        serializeArgs(args) {
          return graph2json(args[0]);
        },
        parseArgs(args) {
          return [json2graph(args)];
        }
      },
      setEyeballs: {
        serializeArgs(ebs) {
          return serializeSpatialHashTable(ebs[0]);
        },
        parseArgs(ebs) {
          return [parseSpatialHashTable(ebs, getEyeballBounds)];
        }
      }
    }
  );
  function pushLines(graph, eyeballs, index) {
    for (const vert of graph.vertices) {
      const eyesInRange = inCircle(
        eyeballs,
        { center: vert.data.initialPos, radius: 0 },
        (e) => ({
          radius: e.forceRadius,
          center: e.pos
        })
      );
      let offset = [0, 0];
      for (const e of eyesInRange) {
        if (e.index !== index) continue;
        const offsetToEye = sub2(vert.data.initialPos, e.pos);
        const distToEye = length2(offsetToEye);
        const pushFactor = rescale(distToEye, 0, e.forceRadius, 1, 0);
        const pushMag = pushFactor ** 2 * e.forceRadius * 0.3;
        const push = rescale2(offsetToEye, pushMag);
        offset = add2(offset, mul2(push, [1, 0.75]));
        vert.data.pushed = true;
      }
      vert.data.pos = add2(vert.data.initialPos, offset);
    }
  }
  function getEyeballBounds(e) {
    const maxRadius = Math.max(e.forceRadius, e.irisRadius, e.pupilRadius);
    return {
      a: sub2(e.pos, [maxRadius, maxRadius]),
      b: add2(e.pos, [maxRadius, maxRadius])
    };
  }
  function addEyeballs(eyeballs, tryCount, logMax, logMin, index) {
    for (const i of smartRange(tryCount)) {
      const radius = Math.pow(10, i.remap(logMax, logMin));
      const center = sub2([Math.random(), Math.random()], [0.5, 0.5]);
      const MARGIN = 1 + Math.random() ** 0.5 * 0.2;
      if (inCircle(eyeballs, { radius: radius * MARGIN, center }, (t) => ({
        radius: t.irisRadius * 1.4 * MARGIN,
        center: t.pos
      })).size > 0) {
        continue;
      }
      eyeballs.insert({
        pos: center,
        irisRadius: radius * 0.6,
        pupilRadius: radius * 0.3,
        forceRadius: radius * 3,
        index
      });
    }
  }
  function tileEyeballs(eyeballs) {
    const balls = eyeballs.all();
    for (const b of balls) {
      for (const offsetVector of [
        [1, 0],
        [0, 1],
        [1, 1]
      ]) {
        eyeballs.insert({
          ...b,
          pos: add2(b.pos, offsetVector)
        });
      }
    }
  }
  var frames = [];
  function enqueueAnimationFrame(process) {
    return new Promise((resolve, reject) => {
      frames.push(async () => {
        const res = await process();
        resolve(res);
      });
    });
  }
  async function loop() {
    let startTime = Date.now();
    while (Date.now() - startTime < 1e3 / 60 && frames.length > 0) {
      const frame = frames.shift();
      if (frame) await frame();
    }
    requestAnimationFrame(loop);
  }
  function lookupEyeballForceField(ebs, position, index) {
    const eyesInRange = inCircle(ebs, { center: position, radius: 0 }, (e) => ({
      radius: e.forceRadius,
      center: e.pos
    }));
    let offset = [0, 0];
    for (const e of eyesInRange) {
      if (index !== void 0 && e.index !== index) continue;
      const offsetToEye = sub2(position, e.pos);
      const distToEye = length2(offsetToEye);
      const pushFactor = rescale(distToEye, 0, e.forceRadius, 1, 0);
      const pushMag = pushFactor ** 2 * e.forceRadius * 0.3;
      const push = rescale2(offsetToEye, pushMag);
      offset = add2(offset, mul2(push, [1, 0.75]));
    }
    return offset;
  }
  loop();
  inMainThread(async () => {
    const size = Math.round(window.innerWidth * window.devicePixelRatio);
    setSize(size);
    await tp.broadcast.setSize(size);
    const mainThreadEyeballs = spatialHashTable(
      {
        a: [-0.3, -0.3],
        b: [1.3, 1.3]
      },
      [100, 100],
      getEyeballBounds
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
    const ctx = canvas.getContext("2d");
    const draw = pointDrawer(canvas, ctx);
    addEyeballs(mainThreadEyeballs, 100, -1.1, -1.4, 0);
    addEyeballs(mainThreadEyeballs, 1e3, -1.4, -1.7, 1);
    addEyeballs(mainThreadEyeballs, 1e4, -1.7, -2, 2);
    addEyeballs(mainThreadEyeballs, 4e4, -2, -2.7, 3);
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
              canvas.height
            ]);
            if (r) {
              ctx.drawImage(
                r.image,
                Math.floor(r.drawAt[0]),
                Math.floor(r.drawAt[1])
              );
            }
          });
        })
      ),
      Promise.all(
        smartRange(Math.ceil(LINE_COUNT)).map(async (line) => {
          const graph = createGraph();
          smartRange(POINTS_PER_LINE).reduce(
            (prev, point) => {
              const pos = [
                point.remap(-0.1, 1.1, true),
                line.remap(-0.1, 1.1)
              ];
              const pt = addVertex(graph, {
                pos,
                initialPos: pos,
                pushed: false
              });
              if (!point.start() && prev) {
                addEdge(graph, [prev, pt], {});
              }
              return pt;
            },
            null
          );
          const components = getConnectedComponents(
            await tp.send.shiftGraph(graph)
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
                        (v) => length2(
                          lookupEyeballForceField(
                            mainThreadEyeballs,
                            v,
                            void 0
                          )
                        ),
                        p,
                        1e-3
                      )
                    ),
                    normalize2([1, -1])
                  );
                  if (isNaN(d)) d = 0;
                  const normd = clamp(d + rand(-0.5, 0.5), 0, 1);
                  return lerp(
                    normd,
                    1 / MAX_LINE_POINT_DENSITY,
                    1 / MIN_LINE_POINT_DENSITY
                  );
                }
              );
              console.log(toDraw.length);
              ctx.beginPath();
              for (const e of toDraw) {
                const pos = e;
                draw.pointUnscaled(
                  add2(scale2(pos, canvas.width), [rand(-1, 1), rand(-1, 1)])
                );
              }
              ctx.stroke();
            }
          });
        })
      )
    ]);
    console.log(
      "PERF",
      getPerformanceStatistics(await tp.getCurrentPerformanceRecords())
    );
  });
})();
