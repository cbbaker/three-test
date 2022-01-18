import * as three from 'three';
import * as Rx from 'rxjs-compat';
import { Move, Twirl } from './gestures';
import input, { Input } from './input';
import dodecahedron from './dodecahedron';
import zonohedron from './zonohedron';
import icosahedron from './icosahedron';
import clock, { Clock } from './clock';

export type State = {
		geometryType: string;
		scene: three.Scene;
		mesh: three.Object3D;
		orientation: three.Quaternion;
		cameraZ: number;
};

// function randomQuat(): three.Quaternion {
// 		for (;;) {
// 				const rand = [0, 1, 2, 3].map(Math.random);
// 				const len2 = rand.reduce((total, num) => total + num * num, 0)
// 				if (len2 > 1.0 || len2 < 0.00001) {
// 						continue;
// 				}

// 				const invLen = 1.0 / Math.sqrt(len2);
// 				const [x, y, z, w] = rand.map(v => v * invLen);
// 				return new three.Quaternion(x, y, z, w);
// 		}
// }

// function randomQuats(): three.Quaternion[] {
// 		const quats = [
// 				randomQuat(),
// 				randomQuat(),
// 				randomQuat(),
// 				randomQuat(),
// 		];

// 		quats.push(quats[0]);
// 		return quats;
// }

// function initQuats(): three.Quaternion[] {
// 		const quats = [
// 				new three.Quaternion(1, 0, 0, 0),
// 				new three.Quaternion(0, 0, 1, 0),
// 				new three.Quaternion(0, 0, 0, 1),
// 				new three.Quaternion(0, 1, 0, 0),
// 		];

// 		quats.push(quats[0]);
// 		return quats;
// }

export const initialState = {
		scene: new three.Scene(),
		orientation: new three.Quaternion(0, 0, 0, 1),
		cameraZ: 6,
};

type Updater = (state: State) => State;

const geometry = input.pluck('geometry') as Rx.Observable<string>;

const mesh = geometry.distinctUntilChanged().switchMap((geometryType: string) => {
		switch (geometryType) {
				case 'icosahedron':
						return icosahedron(initialState.scene);
				case 'zonohedron':
						return zonohedron(initialState.scene);
				default:
						return dodecahedron(initialState.scene);
		}
});

const events = clock.withLatestFrom(input).withLatestFrom(mesh);

function doMove({ x, y }: Move, state: State, mesh: three.Object3D): State {
		const amount = Math.sqrt(x * x + y * y);
		if (amount > 0.001) {
				const cos = Math.cos(amount * 0.01), sin = Math.sin(amount * 0.01);
				const q = new three.Quaternion(sin * y / amount, sin * x / amount, 0, cos);
				state.orientation.premultiply(q);
				mesh.quaternion.copy(state.orientation);
		}

		return { ...state, mesh };
}

function doTwirl({ angle, scale }: Twirl, state: State, mesh: three.Object3D): State {
		if (angle > 0.001 || angle < -0.001) {
				const cos = Math.cos(-angle), sin = Math.sin(-angle);
				const q = new three.Quaternion(0, 0, sin, cos);
				state.orientation.premultiply(q);
				mesh.quaternion.copy(state.orientation);
		}

		const cameraZ = state.cameraZ * (scale > 0.01 ? 1/scale : 1);

		return { ...state, cameraZ, mesh };
}

const updater = events.map(([[_, input], mesh]: [[Clock, Input], three.Object3D]) => (state: State) => {
		const {
				gesture,
		} = input;
		switch (gesture.type) {
				case 'move':
						return doMove(gesture, state, mesh);
				case 'twirl':
						return doTwirl(gesture, state, mesh);
		}
});

const state = Rx.Observable
		.merge(updater)
		.startWith(initialState)
		.scan((state: State, updater: Updater) => updater(state));

export default state;
