import * as three from 'three';
import * as Rx from 'rxjs-compat';
import * as Immutable from 'immutable';
import input, { Input, initColors, initDodecahedronControls, initZonohedronControls } from './input';
import { Dodecahedron } from './dodecahedron';
import { Zonohedron } from './zonohedron';
import clock, { Clock } from './clock';
import { AnimatedOrientation } from './AnimatedOrientation';

export type StateParams = {
		object?: AnimatedOrientation;
		geometryType?: 'dodecahedron' | 'zonohedron';
		scene?: three.Scene;
		mesh?: three.Object3D;
		speed?: number;
		cameraZ?: number;
}

export class State extends Immutable.Record({
		object: new AnimatedOrientation(),
		speed: 1,
		geometryType: undefined,
		scene: undefined,
		mesh: undefined,
		cameraZ: undefined,
}) {
		constructor(params?: StateParams) {
				params ? super(params) : super();
		}

		with(values: StateParams) {
				return this.merge(values) as this;
		}
}


function randomQuat(): three.Quaternion {
		for (;;) {
				const rand = [0, 1, 2, 3].map(Math.random);
				const len2 = rand.reduce((total, num) => total + num * num, 0)
				if (len2 > 1.0 || len2 < 0.00001) {
						continue;
				}

				const invLen = 1.0 / Math.sqrt(len2);
				const [x, y, z, w] = rand.map(v => v * invLen);
				return new three.Quaternion(x, y, z, w);
		}
}

function randomQuats(): three.Quaternion[] {
		const quats = [
				randomQuat(),
				randomQuat(),
				randomQuat(),
				randomQuat(),
		];

		quats.push(quats[0]);
		return quats;
}

export const initialState = new State({
		object: new AnimatedOrientation(randomQuats()),
		scene: new three.Scene(),
});

const events = clock.withLatestFrom(input);

type Updater = (state: State) => State;

type Cleanup = () => void;
let cleanup = [] as Cleanup[];

function doCleanup() {
		cleanup.forEach(action => action());
		cleanup = [];
}
  
function addZonohedron(state: State) {
		const mesh = Zonohedron.object3D(initColors(), initZonohedronControls());
    state.scene.add( mesh );
		cleanup.push(() => { state.scene.remove(mesh) })
		return state.with({ mesh, geometryType: 'zonohedron' });
}

function addDodecahedron(state: State) {
		const mesh = Dodecahedron.object3D(initColors(), initDodecahedronControls());
    state.scene.add( mesh );
		cleanup.push(() => { state.scene.remove(mesh) })
		return state.with({ mesh, geometryType: 'dodecahedron' });
}

const updater = events.map(([clock, input]: [Clock, Input]) => (state: State) => {
		const object = state.object.process(clock, input);
		const newState = state.with({ object, cameraZ: input.cameraZ });
		const geometryType = input.geometry;
		if (newState.geometryType !== geometryType) {
				doCleanup();
				switch (geometryType) {
						case 'dodecahedron':
								return addDodecahedron(state);
						case 'zonohedron':
								return addZonohedron(state);
				}
		}
		return newState;
});

const state = Rx.Observable
		.merge(updater)
		.startWith(initialState)
		.scan((state: State, updater: Updater) => updater(state));

export default state;
