import { GPU } from "gpu.js";
const gpu = new GPU();

function findIntersection(
  lineOneA: number[], // A point [x,y]
  lineOneB: number[],
  lineTwoA: number[],
  lineTwoB: number[]
): number[] {
  let denominator =
    (lineTwoB[1] - lineTwoA[1]) * (lineOneB[0] - lineOneA[0]) -
    (lineTwoB[0] - lineTwoA[0]) * (lineOneB[1] - lineOneA[1]);
  if (denominator === 0) {
    return [0, 0];
  }
  let a = lineOneA[1] - lineTwoA[1];
  let b = lineOneA[0] - lineTwoA[0];
  let numerator1 =
    (lineTwoB[0] - lineTwoA[0]) * a -
    (lineTwoB[1] - lineTwoA[1]) * b;
  let numerator2 =
    (lineOneB[0] - lineOneA[0]) * a -
    (lineOneB[1] - lineOneA[1]) * b;
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  if (a > 0 && a < 1 && b > 0 && b < 1) {
    return [
      lineOneA[0] + a * (lineOneB[0] - lineOneA[0]),
      lineOneA[1] + a * (lineOneB[1] - lineOneA[1])
    ];
  } else {
    return [0, 0];
  }
}

function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

function getDistance(a: number[], b: number[]): number {
  const x1 = a[0];
  const y1 = a[1];
  const x2 = b[0];
  const y2 = b[1];

  const h = (x2 - x1) * (x2 - x1);
  const v = (y2 - y1) * (y2 - y1);
  return Math.sqrt(h + v);
}

// @ts-ignore
gpu.addFunction(findIntersection);
// @ts-ignore
gpu.addFunction(degreesToRadians);
// @ts-ignore
gpu.addFunction(getDistance);

/*
 * Given:
 * The center points - c: number[2][10] - eg: [[5,5], [5.5,5.5]]
 * The angle in degrees - o: number - eg: 90
 * The radius - r: number - eg: 5
 * The blockers - b: number[2][2][walls.length * 2]
 * - eg: [[[x1,y1],[x2,y2]], [[x1,y1],[x2,y2]]]
 *
 * Return:
 * The points where the light reaches - [[x,y]]: number[2][10][720]
 */
const gpuRayCast = gpu.createKernel(
  function(
    cs: number[][],
    r: number,
    b: number[][][],
    blockersSize: number
  ) {
    const angle = this.thread.x as number;
    const ci = this.thread.y as number;
    const c = [cs[ci][0], cs[ci][1]];

    const endX =
      cs[ci][0] + r * Math.cos(degreesToRadians(angle));
    const endY =
      cs[ci][1] + r * Math.sin(degreesToRadians(angle));
    const endPoint = [Math.floor(endX), Math.floor(endY)];

    let currentClosestEnd = endPoint;
    let currentClosestEndDistance = getDistance(c, endPoint);

    for (let i = 0; i < blockersSize; i++) {
      let intersection = findIntersection(
        [c[0], c[1]],
        [endPoint[0], endPoint[1]],
        [b[i][0][0], b[i][0][1]],
        [b[i][1][0], b[i][1][1]]
      );
      const dp = getDistance(c, intersection);
      if (
        intersection[0] !== 0 &&
        intersection[1] !== 0 &&
        dp < currentClosestEndDistance
      ) {
        currentClosestEndDistance = dp;
        currentClosestEnd = intersection;
      }
    }
    return currentClosestEnd;
  },
  {
    output: [360, 11]
  }
);

gpuRayCast.setDynamicArguments(true);
gpuRayCast.setTactic("speed");

export default gpuRayCast;
