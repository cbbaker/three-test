import * as Immutable from 'immutable';
import { Dodecahedron } from './dodecahedron';
import { Zonohedron } from './zonohedron';

export type StateParams = {
		dodecahedron?: Dodecahedron;
		zonohedron?: Zonohedron;
		speed?: number;
}

export class State extends Immutable.Record({dodecahedron: new Dodecahedron(), zonohedron: new Zonohedron(), speed: 1}) {
		constructor(params?: StateParams) {
				params ? super(params) : super();
		}

		with(values: StateParams) {
				return this.merge(values) as this;
		}
}

