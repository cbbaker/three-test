import 'bootstrap/dist/css/bootstrap.min.css';
import * as three from 'three';
import * as _ from 'lodash';
import * as Rx from 'rxjs-compat';
import * as Immutable from 'immutable';
import './styles.css';
import { State } from './state';
import input, { Input } from './input';
// import { Dodecahedron } from './dodecahedron';
import { Zonohedron } from './zonohedron';
import clock, { Clock } from './clock';
import QuaternionSpline from './quaternionSpline';

const root3over2 = 0.5 * Math.sqrt(3);

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

const root2over2 = 0.5 * Math.sqrt(2);

const initialState = new State({
		zonohedron: new Zonohedron(randomQuats()),
		// zonohedron: new Zonohedron([
		// 		new three.Quaternion(0, 1, 0, 0), 
		// 		new three.Quaternion(0, 0, 0, 1),
		// 		new three.Quaternion(0, -1, 0, 0),
		// 		new three.Quaternion(0, 0, 0, 1),
		// 		new three.Quaternion(0, 1, 0, 0), 
		// ]),
});

const events = clock.withLatestFrom(input);

type Reducer = (state: State) => State;

const zonohedron = events.map(([clock, input]: [Clock, Input]) => (state: State) => {
		const zonohedron = state.zonohedron.process(clock, input);
		return state.with({ zonohedron });
});

const state = Rx.Observable
		.merge(zonohedron)
		.startWith(initialState)
		.scan((state: State, reducer: Reducer) => reducer(state));

const game = clock.withLatestFrom(state, (_: Clock, state: State) => state);

// clock.sampleTime(5000, Rx.Scheduler.animationFrame).subscribe((clock) => {
    // document.querySelector("#clock").innerHTML = `${clock.fps}`;
// });
  
function setup() {
		const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
		const width = canvas.clientWidth
		const height = width * 9 / 16;
		canvas.width = width;
		canvas.height = height;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
    const camera = new three.PerspectiveCamera( 70, canvas.width / canvas.height, 0.01, 10 ); 
    camera.position.z = 6;
		
    const scene = new three.Scene();
		
		const mesh = Zonohedron.object3D();
    scene.add( mesh );

		const ambient = new three.AmbientLight(0x808080);
		scene.add(ambient);

		const right = new three.PointLight;
		right.position.set(5, 5, 5);
		scene.add(right);
		
    const renderer = new three.WebGLRenderer({
				antialias: true,
				canvas,
		});
    renderer.setSize( canvas.width, canvas.height );

		return ({ zonohedron: { spline, time } }: State) => {
				const width = canvas.clientWidth;
				const height = canvas.clientHeight;
				const needsResize = canvas.width !== width || canvas.height !== height;
				if (needsResize) {
						renderer.setSize(width, height, false);
						camera.aspect = width / height;
						camera.updateProjectionMatrix();
				}
				mesh.quaternion.copy(spline.evalAt(time));
				renderer.render(scene, camera);
		};
}

const render = setup();
game.subscribe({
		next: (state) => {
				render(state);
		},
		error: console.error,
		complete: () => console.log('done'),
});
