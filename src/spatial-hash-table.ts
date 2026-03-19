import { rescale, rescaleClamped } from "./interpolation";
import { distance2, Vec2 } from "./math/vector.generated";
import { range } from "./range";

export type Rect = {
  a: Vec2;
  b: Vec2;
};

export type Circle = {
  center: Vec2;
  radius: number;
};

export type SpatialHashTable<T> = {
  getBounds(t: T): Rect;
  buckets: Set<T>[];
  resolution: Vec2;
  bounds: Rect;
  objects: Map<
    T,
    {
      buckets: number[];
    }
  >;
  insert(t: T): void;
  delete(t: T): boolean;
  queryRect(bounds: Rect): Set<T>;
  queryPoint(pt: Vec2): Set<T>;
  all(): Set<T>;
  setObjects(objects: Map<T, { buckets: number[] }>): void;
  setBuckets(buckets: Set<T>[]): void;
};

export type SerializedSpatialHashTable<T> = {
  buckets: Set<T>[];
  resolution: Vec2;
  bounds: Rect;
  objects: Map<
    T,
    {
      buckets: number[];
    }
  >;
};

export function spatialHashTable<T>(
  htBounds: Rect,
  resolution: Vec2,
  getBounds: (t: T) => Rect,
): SpatialHashTable<T> {
  let objects = new Map<T, { buckets: number[] }>();
  let buckets = range(resolution[0] * resolution[1]).map((e) => new Set<T>());

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
      const output = new Set<T>();
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
        b: r,
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
    },
  };
}

export function inCircle<T>(
  sht: SpatialHashTable<T>,
  c: Circle,
  getObjectCircle: (t: T) => Circle,
): Set<T> {
  const rectResult = sht.queryRect({
    a: [c.center[0] - c.radius, c.center[1] - c.radius],
    b: [c.center[0] + c.radius, c.center[1] + c.radius],
  });

  return new Set(
    Array.from(rectResult.values()).filter((e) => {
      const objectCircle = getObjectCircle(e);
      return (
        distance2(objectCircle.center, c.center) <
        objectCircle.radius + c.radius
      );
    }),
  );
}

export function serializeSpatialHashTable<T, S = T>(
  sht: SpatialHashTable<T>,
  serializeItem?: (t: T) => S,
): SerializedSpatialHashTable<S> {
  if (!serializeItem) {
    return {
      // @ts-expect-error
      buckets: sht.buckets,
      resolution: sht.resolution,
      bounds: sht.bounds,
      // @ts-expect-error
      objects: sht.objects,
    };
  }

  const serializedObjects: Map<T, { serialized: S; v: { buckets: number[] } }> =
    new Map(
      [...sht.objects].map(([k, v]) => [
        k,
        { serialized: serializeItem(k), v },
      ]),
    );

  const ssht: SerializedSpatialHashTable<S> = {
    buckets: sht.buckets.map(
      (b) => new Set([...b].map((i) => serializedObjects.get(i)?.serialized!)),
    ),
    resolution: sht.resolution,
    bounds: sht.bounds,
    objects: new Map(
      [...sht.objects].map(([k, v]) => [
        serializedObjects.get(k)!.serialized,
        v,
      ]),
    ),
  };
  return ssht;
}

export function parseSpatialHashTable<T, S = T>(
  ssht: SerializedSpatialHashTable<S>,
  getBounds: (t: T) => Rect,
  parseItem?: (s: S) => T,
): SpatialHashTable<T> {
  if (!parseItem) {
    const sht = spatialHashTable(ssht.bounds, ssht.resolution, getBounds);
    // @ts-expect-error
    sht.setBuckets(ssht.buckets);
    // @ts-expect-error
    sht.setObjects(ssht.objects);
    return sht;
  }

  const parsedObjects: Map<S, { parsed: T; v: { buckets: number[] } }> =
    new Map(
      [...ssht.objects].map(([k, v]) => [k, { parsed: parseItem(k), v }]),
    );

  {
    const sht = spatialHashTable(ssht.bounds, ssht.resolution, getBounds);
    sht.setBuckets(
      ssht.buckets.map(
        (b) => new Set([...b].map((i) => parsedObjects.get(i)?.parsed!)),
      ),
    );
    sht.setObjects(
      new Map(
        [...ssht.objects].map(([k, v]) => [parsedObjects.get(k)!.parsed, v]),
      ),
    );
    return sht;
  }
}
