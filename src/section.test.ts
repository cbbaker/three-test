import { expect } from 'chai';
import Section from './section';

type Pair = [number, number];
const controls = [[0, 0], [1, 0], [0, 1], [1, 1]] as Pair[];

describe("Section", () => {
  it("can be constructed", () => {
    const section = new Section(controls);
    expect(section.controls).to.deep.equal(controls);
  });

  it("splits into halves", () => {
    const section = new Section(controls);
    const [s1, s2] = section.halve();
    expect(s1.controls[0][0]).to.be.closeTo(0, 5);
    expect(s1.controls[0][1]).to.be.closeTo(0, 5);
    expect(s1.controls[1][0]).to.be.closeTo(0.5, 5);
    expect(s1.controls[1][1]).to.be.closeTo(0, 5);
    expect(s1.controls[2][0]).to.be.closeTo(0.5, 5);
    expect(s1.controls[2][1]).to.be.closeTo(0.25, 5);
    expect(s1.controls[3][0]).to.be.closeTo(0.5, 5);
    expect(s1.controls[3][1]).to.be.closeTo(0.5, 5);
    expect(s2.controls[0][0]).to.be.closeTo(0.5, 5);
    expect(s2.controls[0][1]).to.be.closeTo(0.5, 5);
    expect(s2.controls[1][0]).to.be.closeTo(0.5, 5);
    expect(s2.controls[1][1]).to.be.closeTo(0.75, 5);
    expect(s2.controls[2][0]).to.be.closeTo(0.5, 5);
    expect(s2.controls[2][1]).to.be.closeTo(1, 5);
    expect(s2.controls[3][0]).to.be.closeTo(1, 5);
    expect(s2.controls[3][1]).to.be.closeTo(1, 5);
  });

  it("splits recursively", () => {
    const section = new Section(controls);
    expect(section.split(2)).to.have.length(4);
  });

  it("adaptiveSplit splits until a condition is satisfied", () => {
    const section = new Section(controls);
			const condition = (section: Section<Pair>) => {
					const {controls: [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]} = section;
					const dx = x3 - x0, dy = y3 - y0;
					return (dx * dx + dy * dy) < 1;
			};
    expect(section.adaptiveSplit(condition)).to.have.length(2);
  });
});
