(() => {
  // src/interpolation.ts
  function lerp(x, a, b) {
    return a * (1 - x) + b * x;
  }
  function unlerp(x, a, b) {
    return (x - a) / (b - a);
  }
  function rescaleClamped(x, a1, b1, a2, b2) {
    return lerp(clamp(unlerp(x, a1, b1), 0, 1), a2, b2);
  }
  function clamp(x, lo, hi) {
    return Math.max(Math.min(x, hi), lo);
  }

  // src/lookup-optimized-spatial-hash-table.ts
  var OVERFLOW_BUCKETS_BIT = 2147483648;
  function createLookupOptimizedSHTGenerator(params) {
    const { bounds, resolution, getBounds, estimatedObjectsPerBucket } = params;
    const htBounds = bounds;
    function getBucketIndexes(bounds2) {
      const bucketXStart = Math.floor(
        rescaleClamped(
          bounds2.a[0],
          htBounds.a[0],
          htBounds.b[0],
          0,
          resolution[0] - 1
        )
      );
      const bucketXEnd = Math.ceil(
        rescaleClamped(
          bounds2.b[0],
          htBounds.a[0],
          htBounds.b[0],
          0,
          resolution[0]
        )
      );
      const bucketYStart = Math.floor(
        rescaleClamped(
          bounds2.a[1],
          htBounds.a[1],
          htBounds.b[1],
          0,
          resolution[1] - 1
        )
      );
      const bucketYEnd = Math.ceil(
        rescaleClamped(
          bounds2.b[1],
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
    const bucketsArrayFixedSize = estimatedObjectsPerBucket + 1;
    const bucketElementCount = resolution[0] * resolution[1] * bucketsArrayFixedSize;
    return (objects) => {
      const buckets = new Uint32Array(bucketElementCount);
      const overflowBuckets = [];
      for (let j = 0; j < objects.length; j++) {
        const indexes = getBucketIndexes(getBounds(objects[j]));
        for (const i of indexes) {
          const indexIntoBucketsArray = i * bucketsArrayFixedSize;
          const len = buckets[indexIntoBucketsArray];
          if (len & OVERFLOW_BUCKETS_BIT) {
            overflowBuckets[len & ~OVERFLOW_BUCKETS_BIT].push(objects[j]);
          } else {
            if (len === estimatedObjectsPerBucket) {
              buckets[indexIntoBucketsArray] = overflowBuckets.length | OVERFLOW_BUCKETS_BIT;
              overflowBuckets.push([objects[j]]);
            } else {
              let indexToSet = indexIntoBucketsArray + len + 1;
              buckets[indexToSet] = j;
              buckets[indexIntoBucketsArray]++;
            }
          }
        }
      }
      return {
        buckets,
        overflowBuckets,
        getBounds,
        objects,
        estimatedObjectsPerBucket,
        queryRect(bounds2) {
          const indexes = getBucketIndexes(bounds2);
          return (function* () {
            for (const i of indexes) {
              const bktBaseIndex = i * bucketsArrayFixedSize;
              const bktInfo = buckets[bktBaseIndex];
              const useOverflow = bktInfo & OVERFLOW_BUCKETS_BIT;
              let count = useOverflow ? estimatedObjectsPerBucket : bktInfo;
              for (let j = 1; j < count + 1; j++) {
                yield objects[buckets[bktBaseIndex + j]];
              }
              if (useOverflow) {
                for (const of of overflowBuckets[bktInfo & ~OVERFLOW_BUCKETS_BIT])
                  yield of;
              }
            }
          })();
        },
        queryPoint(bounds2) {
          return this.queryRect({ a: bounds2, b: bounds2 });
        }
      };
    };
  }

  // src/math/vector.generated.ts
  function sub2(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }

  // src/range.ts
  function range(hi) {
    let arr = [];
    for (let i = 0; i < hi && i < 1e7; i++) {
      arr.push(i);
    }
    return arr;
  }
  function rand(lo, hi, random) {
    if (!random) random = () => Math.random();
    return random() * (hi - lo) + lo;
  }

  // demos-src/efficient-sht.demo.ts
  var shtgen = createLookupOptimizedSHTGenerator({
    bounds: {
      a: [0, 0],
      b: [1024, 1024]
    },
    resolution: [100, 100],
    getBounds: (c) => ({
      a: [c.center[0] - c.radius, c.center[1] - c.radius],
      b: [c.center[0] + c.radius, c.center[1] + c.radius]
    }),
    estimatedObjectsPerBucket: 10
  });
  var circles = range(1e4).map((e) => {
    return {
      center: [rand(0, 1024), rand(0, 1024)],
      radius: rand(1024 / 100 * 0.5, 1024 / 100 * 2)
    };
  });
  var sht = shtgen(circles);
  console.log(sht);
  var canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.width = 1024;
  canvas.height = 1024;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#00000004";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.center[0], c.center[1], c.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#0f0";
  var queryRect = {
    a: [300, 400],
    b: [500, 600]
  };
  ctx.strokeRect(...queryRect.a, ...sub2(queryRect.b, queryRect.a));
  for (const c of sht.queryRect(queryRect)) {
    ctx.beginPath();
    ctx.arc(c.center[0], c.center[1], c.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
})();
