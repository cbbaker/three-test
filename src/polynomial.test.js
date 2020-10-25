import { expect } from 'chai'
import Polynomial from './polynomial';

describe('Polynomial', () => {
		it('evalAt evaluates the polynomial', () => {
				const poly = new Polynomial([1, -2, 3], 1);
				expect(poly.evalAt(0)).to.equal(1);
				expect(poly.evalAt(1)).to.equal(2);
				expect(poly.evalAt(-1)).to.equal(6);
		});

		it('derivative computes the derivative', () => {
				const poly = new Polynomial([1, -2, 3], 1);
				expect(poly.derivative().coefficients).to.equal([-2, 6]);
		});

		it('toControlPoints converts to bezier spline', () => {
				const poly = new Polynomial([0, 3, -9, 6], 1);
				expect(poly.toControlPoints()).to.equal([0, 1, -1, 0]);
		});
});
