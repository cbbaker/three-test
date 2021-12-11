import * as three from 'three';
import * as Immutable from 'immutable';
import { AnimatedOrientation } from './AnimatedOrientation';

export type StateParams = {
		object?: AnimatedOrientation;
		geometryType?: 'dodecahedron' | 'zonohedron';
		scene?: three.Scene;
		mesh?: three.Object3D;
		speed?: number;
}

export class State extends Immutable.Record({
		object: new AnimatedOrientation(),
		speed: 1,
		geometryType: undefined,
		scene: undefined,
		mesh: undefined,
}) {
		constructor(params?: StateParams) {
				params ? super(params) : super();
		}

		with(values: StateParams) {
				return this.merge(values) as this;
		}
}

