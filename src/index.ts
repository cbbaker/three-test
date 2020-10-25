import * as three from 'three';
import * as _ from 'lodash';
import * as Rx from 'rxjs-compat';
import * as Immutable from 'immutable';
import './styles.css';
import { State } from './state';
import input, { Input } from './input';
import { Cube } from './cube';
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

const initialState = new State({
		cube: new Cube(randomQuats()),
});

const events = clock.withLatestFrom(input);

type Reducer = (state: State) => State;

const cube = events.map(([clock, input]: [Clock, Input]) => (state: State) => {
		const cube = state.cube.process(clock, input);
		return state.with({ cube });
});

const state = Rx.Observable
		.merge(cube)
		.startWith(initialState)
		.scan((state: State, reducer: Reducer) => reducer(state));

const game = clock.withLatestFrom(state, (_: Clock, state: State) => state);

// clock.sampleTime(5000, Rx.Scheduler.animationFrame).subscribe((clock) => {
    // document.querySelector("#clock").innerHTML = `${clock.fps}`;
// });
  
function setup() {
		const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
		canvas.width = 640;
		canvas.height = 480;
		canvas.style.width = '640px';
		canvas.style.height = '480px';
     const camera = new three.PerspectiveCamera( 70, canvas.width / canvas.height, 0.01, 10 ); 
    camera.position.z = 1;
		
    const scene = new three.Scene();
		
		const mesh = Cube.object3D();
    scene.add( mesh );
		
    const renderer = new three.WebGLRenderer({
				antialias: true,
				canvas,
		});
    renderer.setSize( canvas.width, canvas.height );

		return ({ cube: { spline, time } }: State) => {
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
