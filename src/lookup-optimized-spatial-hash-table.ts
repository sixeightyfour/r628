import { rescaleClamped } from "./interpolation";
import { Vec2 } from "./math/vector.generated";
import { Rect } from "./spatial-hash-table";

export type LookupOptimizedSpatialHashTable<T> = {
  getBounds(t: T): Rect;
  buckets: Uint32Array;
  overflowBuckets: T[][];
  estimatedObjectsPerBucket: number;
  objects: T[];
  queryRect(bounds: Rect): Iterable<T>;
  queryPoint(pt: Vec2): Iterable<T>;
};

const OVERFLOW_BUCKETS_BIT = 2147483648;

export function createLookupOptimizedSHTGenerator<T>(params: {
  bounds: Rect;
  resolution: Vec2;
  getBounds: (t: T) => Rect;
  estimatedObjectsPerBucket: number;
}) {
  const { bounds, resolution, getBounds, estimatedObjectsPerBucket } = params;

  const htBounds = bounds;

  function getBucketIndexes(bounds: Rect): number[] {
    const bucketXStart = Math.floor(
      rescaleClamped(
        bounds.a[0],
        htBounds.a[0],
        htBounds.b[0],
        0,
        resolution[0] - 1,
      ),
    );
    const bucketXEnd = Math.ceil(
      rescaleClamped(
        bounds.b[0],
        htBounds.a[0],
        htBounds.b[0],
        0,
        resolution[0],
      ),
    );
    const bucketYStart = Math.floor(
      rescaleClamped(
        bounds.a[1],
        htBounds.a[1],
        htBounds.b[1],
        0,
        resolution[1] - 1,
      ),
    );
    const bucketYEnd = Math.ceil(
      rescaleClamped(
        bounds.b[1],
        htBounds.a[1],
        htBounds.b[1],
        0,
        resolution[1],
      ),
    );

    const indexes: number[] = [];

    for (
      let x = bucketXStart;
      x < Math.max(bucketXEnd, bucketXStart + 1);
      x++
    ) {
      for (
        let y = bucketYStart;
        y < Math.max(bucketYEnd, bucketYStart + 1);
        y++
      ) {
        indexes.push(x + y * resolution[0]);
      }
    }
    return indexes;
  }

  const bucketsArrayFixedSize = estimatedObjectsPerBucket + 1;

  const bucketElementCount =
    resolution[0] * resolution[1] * bucketsArrayFixedSize;

  return (objects: T[]): LookupOptimizedSpatialHashTable<T> => {
    const buckets = new Uint32Array(bucketElementCount);

    const overflowBuckets: T[][] = [];

    for (let j = 0; j < objects.length; j++) {
      const indexes = getBucketIndexes(getBounds(objects[j]));

      for (const i of indexes) {
        const indexIntoBucketsArray = i * bucketsArrayFixedSize;

        const len = buckets[indexIntoBucketsArray];

        // if already overflowing, add ref to object to overflow buckets
        if (len & OVERFLOW_BUCKETS_BIT) {
          overflowBuckets[len & ~OVERFLOW_BUCKETS_BIT].push(objects[j]);
        } else {
          //establish overflow bucket
          if (len === estimatedObjectsPerBucket) {
            buckets[indexIntoBucketsArray] =
              overflowBuckets.length | OVERFLOW_BUCKETS_BIT;
            overflowBuckets.push([objects[j]]);

            // add to regular bucket
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
      queryRect(bounds): Iterable<T> {
        const indexes = getBucketIndexes(bounds);

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
      queryPoint(bounds): Iterable<T> {
        return this.queryRect({ a: bounds, b: bounds });
      },
    };
  };
}

type asdjkasdlf = number[] extends Iterable<number> ? 1 : 0;
