import * as three from 'three';
import * as _ from 'lodash';
import * as Rx from 'rxjs-compat';
import * as Immutable from 'immutable';
import './styles.css';
import input from './input';
import clock, { Clock } from './clock';

type CubeParams = {
		angularVelocity: three.Vector3,
		orientation: three.Quaternion,
}

class Cube extends Immutable.Record({angularVelocity: new three.Vector3(), orientation: new three.Quaternion() }) {
		constructor(params?: CubeParams) {
				params ? super(params) : super();
		}

		with(values: CubeParams) {
				return this.merge(values) as this;
		}
}

type StateParams = {
		cube: Cube,
}

class State extends Immutable.Record({cube: new Cube()}) {
		constructor(params?: StateParams) {
				params ? super(params) : super();
		}

		with(values: StateParams) {
				return this.merge(values) as this;
		}
}

const initialState = new State({
		cube: new Cube({
				angularVelocity: new three.Vector3(0.01, 0.03, 0.02),
				orientation: new three.Quaternion(),
		}),
});

const events = clock.withLatestFrom(input, (clock, state) => ({ clock, state }));

const cube = events.map(({clock: {delta}, state: input}: { clock: Clock, state: boolean }) => (state: State) => {
		const cube = state.cube;
		const { angularVelocity, orientation } = cube;

 		if (input) {
				const scale = 0.01;
				const impulse = new three.Vector3(
						(Math.random() - 0.5) * scale,
						(Math.random() - 0.5) * scale,
						(Math.random() - 0.5) * scale
				);
				angularVelocity.add(impulse);
		}

		const dq = new three.Quaternion(delta * angularVelocity.x, delta * angularVelocity.y, delta * angularVelocity.z, 1)
		dq.normalize();
		const newOrientation = new three.Quaternion().multiplyQuaternions(orientation, dq);
		const friction = 0.99;
		const newAngVel = new three.Vector3(friction * angularVelocity.x, friction * angularVelocity.y, friction * angularVelocity.z);

		return state.with({
				cube: cube.with({angularVelocity: newAngVel, orientation: newOrientation})
		});
});

type Reducer = (state: State) => State;

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
		
    const geometry = new three.BoxGeometry( 0.2, 0.2, 0.2 );
    const material = new three.MeshNormalMaterial();
		
    const mesh = new three.Mesh( geometry, material );
    scene.add( mesh );
		
    const renderer = new three.WebGLRenderer({
				antialias: true,
				canvas,
		});
    renderer.setSize( canvas.width, canvas.height );

		return (state: State) => {
				mesh.quaternion.copy(state.cube.orientation);
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
