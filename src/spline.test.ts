import { expect } from 'chai';
import Spline from './spline';

const pts = [[0, 0, 0], [1/2, 1/3, 1], [1/2, 2/3, 1], [1, 1, 0]];
function metric(p1: [number, number], p2: [number, number]) {
		const [x1, y1] = p1, [x2, y2] = p2;
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

describe("Spline class", () => {
  it("can be constructed", () => {
    const spline = new Spline(pts, metric);
    expect(spline.points).to.deep.equal(pts);
    expect(spline.metric).to.deep.equal(metric);
  });

  it("computes section list", () => {
    const spline = new Spline(pts, metric);
    expect(spline.sections).to.have.length(3);
  });

  it("computes flattened controls", () => {
    const spline = new Spline(pts, metric);
    const flattened = spline.flattenedControlPoints();
    expect(flattened).to.have.length(10);
  });

  it("split subdivides sections", () => {
    const spline = new Spline(pts, metric);
    const sections = spline.split(2);
    expect(sections).to.have.length(12);
  });

  it("flattenedPoints splits the spline and collects the points", () => {
    const spline = new Spline(pts, metric);
    const points = spline.flattenedPoints(2);
    expect(points).to.have.length(13);
  });
});
