import Polynomial from './polynomial';

test('evalAt evaluates the polynomial', () => {
    const poly = new Polynomial([1, -2, 3], 1);
    expect(poly.evalAt(0)).toBe(1);
    expect(poly.evalAt(1)).toBe(2);
    expect(poly.evalAt(-1)).toBe(6);
});

test('derivative computes the derivative', () => {
    const poly = new Polynomial([1, -2, 3], 1);
    expect(poly.derivative().coefficients).toEqual([-2, 6]);
});

test('toControlPoints converts to bezier spline', () => {
    const poly = new Polynomial([0, 3, -9, 6], 1);
    expect(poly.toControlPoints()).toEqual([0, 1, -1, 0]);
});
