import * as Immutable from 'immutable';
import { Cube } from './cube';

export type StateParams = {
		cube?: Cube;
		speed?: number;
}

export class State extends Immutable.Record({cube: new Cube(), speed: 1}) {
		constructor(params?: StateParams) {
				params ? super(params) : super();
		}

		with(values: StateParams) {
				return this.merge(values) as this;
		}
}

