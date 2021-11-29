import { expect } from 'chai';
import bitGenerator from './bitGenerator';

describe('bitGenerator', () => {
		context('when len is 1', () => {
				it('returns the right result', () => {
						expect(Array.from(bitGenerator(1))).to.deep.equal([[0], [1]])
				});
		});
		context('when len is 2', () => {
				it('returns the right result', () => {
						expect(Array.from(bitGenerator(2))).to.deep.equal([[0, 0], [1, 0], [0, 1], [1, 1]])
				});
		});
});
