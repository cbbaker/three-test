import * as math from 'mathjs';
import _ from 'lodash';

const m1 = math.matrix([[  1,   0,   0,   0],
                        [1/2, 1/2,   0,   0],
                        [1/4, 1/2, 1/4,   0],
                        [1/8, 3/8, 3/8, 1/8]]);
const m2 = math.matrix([[1/8, 3/8, 3/8, 1/8],
                        [  0, 1/4, 1/2, 1/4],
                        [  0,   0, 1/2, 1/2],
                        [  0,   0,   0,   1]]);

export default class Section<T extends number[]> {
		controls: T[];
		
		constructor(controls: T[]) {
				this.controls = controls;
		}

		halve(): Section<T>[] {
				const s1 = math.multiply(m1, this.controls);
				const s2 = math.multiply(m2, this.controls);
				return [new Section(s1.toArray() as T[]), new Section(s2.toArray() as T[])];
		}

		split(iterations: number): Section<T>[] {
				if (iterations > 0) {
						let halves = this.halve();
						return _.flatMap(halves, (section: Section<T>) => section.split(iterations - 1));
				} else {
						return [this];
				}
		}

		adaptiveSplit(condition: ((section: Section<T>) => boolean)): Section<T>[] {
				if (condition(this)) {
						return [this];
				} else {
						let halves = this.halve();
						return _.flatMap(halves, section => section.adaptiveSplit(condition));
				}
		}
}
