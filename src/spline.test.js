import Spline from './spline.js';

const pts = [[0, 0, 0], [1/2, 1/3, 1], [1/2, 2/3, 1], [1, 1, 0]];
function metric([x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

describe("Spline class", () => {
  test("can be constructed", () => {
    const spline = new Spline(pts, metric);
    expect(spline.points).toBe(pts);
    expect(spline.metric).toBe(metric);
  });

  test("computes section list", () => {
    const spline = new Spline(pts, metric);
    expect(spline.sections).toHaveLength(3);
  });

  test("computes flattened controls", () => {
    const spline = new Spline(pts, metric);
    const flattened = spline.flattenedControlPoints();
    expect(flattened).toHaveLength(10);
  });

  test("split subdivides sections", () => {
    const spline = new Spline(pts, metric);
    const sections = spline.split(2);
    expect(sections).toHaveLength(12);
  });

  test("flattenedPoints splits the spline and collects the points", () => {
    const spline = new Spline(pts, metric);
    const points = spline.flattenedPoints(2);
    expect(points).toHaveLength(13);
  });
});
