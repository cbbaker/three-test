import 'bootstrap/dist/css/bootstrap.min.css';
import * as three from 'three';
import './styles.css';
import state, { State, initialState } from './state';
import clock, { Clock } from './clock';


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

		return ({ object: { spline, time }, scene, mesh, cameraZ }: State) => {
				camera.position.z = cameraZ;
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
