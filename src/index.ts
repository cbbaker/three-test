import 'bootstrap/dist/css/bootstrap.min.css';
import * as three from 'three';
import * as Rx from 'rxjs-compat';
import './styles.css';
import { State } from './state';
import input, { Input } from './input';
import { Dodecahedron } from './dodecahedron';
import { Zonohedron } from './zonohedron';
import clock, { Clock } from './clock';
import { AnimatedOrientation } from './AnimatedOrientation';

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
		const mesh = Zonohedron.object3D();
    state.scene.add( mesh );
		cleanup.push(() => { state.scene.remove(mesh) })
		return state.with({ mesh, geometryType: 'zonohedron' });
}

function addDodecahedron(state: State) {
		const mesh = Dodecahedron.object3D();
    state.scene.add( mesh );
		cleanup.push(() => { state.scene.remove(mesh) })
		return state.with({ mesh, geometryType: 'dodecahedron' });
}

const updater = events.map(([clock, input]: [Clock, Input]) => (state: State) => {
		const object = state.object.process(clock, input);
		const newState = state.with({ object });
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
		
		const ambient = new three.AmbientLight(0x808080);
		initialState.scene.add(ambient);

		const right = new three.PointLight;
		right.position.set(5, 5, 5);
		initialState.scene.add(right);
		
    const renderer = new three.WebGLRenderer({
				antialias: true,
				canvas,
		});
    renderer.setSize( canvas.width, canvas.height );

		return ({ object: { spline, time }, scene, mesh }: State) => {
				const width = canvas.clientWidth;
				const height = canvas.clientHeight;
				const needsResize = canvas.width !== width || canvas.height !== height;
				if (needsResize) {
						renderer.setSize(width, height, false);
						camera.aspect = width / height;
						camera.updateProjectionMatrix();
				}
				if (mesh !== undefined) {
						mesh.quaternion.copy(spline.evalAt(time));
				}
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
