import { distance2, mix2, Vec2 } from "../math/vector.generated";

export function equidistantPointsOnCurve(
  curve: Vec2[],
  interval: number,
): Vec2[] {
  if (curve.length === 0) return [];

  const outPoints: Vec2[] = [curve[0]];

  let accumDist = 0;

  for (let i = 0; i < curve.length - 1; i++) {
    const prevPoint = curve[i];
    const currPoint = curve[i + 1];
    const currLineDist = distance2(prevPoint, currPoint);
    const initLength = interval - (accumDist % interval);
    accumDist += currLineDist;
    const newPointCount = Math.floor(accumDist / interval);
    for (let j = 0; j < newPointCount; j++) {
      let distAcross = initLength + j * interval;
      outPoints.push(mix2(distAcross / currLineDist, prevPoint, currPoint));
    }
    accumDist -= newPointCount * interval;
  }

  return outPoints;
}

export function variableDistancePointsOnCurve(
  curve: Vec2[],
  nextDistance: (p: Vec2) => number,
): Vec2[] {
  if (curve.length === 0) return [];

  const outPoints: Vec2[] = [curve[0]];
  let interval = nextDistance(curve[0]);

  let accumDist = 0;

  for (let i = 0; i < curve.length - 1; i++) {
    const prevPoint = curve[i];
    const currPoint = curve[i + 1];
    const currLineDist = distance2(prevPoint, currPoint);
    const initLength = interval - (accumDist % interval);
    accumDist += currLineDist;
    const newPointCount = Math.floor(accumDist / interval);
    let distAcross = initLength;
    while (accumDist > interval) {
      outPoints.push(mix2(distAcross / currLineDist, prevPoint, currPoint));
      accumDist -= interval;
      interval = nextDistance(outPoints.at(-1)!);
      distAcross += interval;
    }
  }

  return outPoints;
}
