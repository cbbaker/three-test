import * as Immutable from 'immutable';
import { Dodecahedron } from './dodecahedron';

export type StateParams = {
		dodecahedron?: Dodecahedron;
		speed?: number;
}

export class State extends Immutable.Record({dodecahedron: new Dodecahedron(), speed: 1}) {
		constructor(params?: StateParams) {
				params ? super(params) : super();
		}

		with(values: StateParams) {
				return this.merge(values) as this;
		}
}

