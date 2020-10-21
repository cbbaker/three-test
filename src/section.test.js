import Section from './section';

const controls = [[0, 0], [1, 0], [0, 1], [1, 1]];

describe("Section", () => {
  test("can be constructed", () => {
    const section = new Section(controls);
    expect(section.controls).toBe(controls);
  });

  test("splits into halves", () => {
    const section = new Section(controls);
    const [s1, s2] = section.halve();
    expect(s1.controls[0][0]).toBeCloseTo(0, 5);
    expect(s1.controls[0][1]).toBeCloseTo(0, 5);
    expect(s1.controls[1][0]).toBeCloseTo(0.5, 5);
    expect(s1.controls[1][1]).toBeCloseTo(0, 5);
    expect(s1.controls[2][0]).toBeCloseTo(0.5, 5);
    expect(s1.controls[2][1]).toBeCloseTo(0.25, 5);
    expect(s1.controls[3][0]).toBeCloseTo(0.5, 5);
    expect(s1.controls[3][1]).toBeCloseTo(0.5, 5);
    expect(s2.controls[0][0]).toBeCloseTo(0.5, 5);
    expect(s2.controls[0][1]).toBeCloseTo(0.5, 5);
    expect(s2.controls[1][0]).toBeCloseTo(0.5, 5);
    expect(s2.controls[1][1]).toBeCloseTo(0.75, 5);
    expect(s2.controls[2][0]).toBeCloseTo(0.5, 5);
    expect(s2.controls[2][1]).toBeCloseTo(1, 5);
    expect(s2.controls[3][0]).toBeCloseTo(1, 5);
    expect(s2.controls[3][1]).toBeCloseTo(1, 5);
  });

  test("splits recursively", () => {
    const section = new Section(controls);
    expect(section.split(2)).toHaveLength(4);
  });

  test("adaptiveSplit splits until a condition is satisfied", () => {
    const section = new Section(controls);
    const condition = ({controls: [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]}) => {
      const dx = x3 - x0, dy = y3 - y0;
      return (dx * dx + dy * dy) < 1;
    };
    expect(section.adaptiveSplit(condition)).toHaveLength(2);
  });
});
