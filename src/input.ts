import * as Rx from 'rxjs-compat';



export type Input = {
		geometry: 'dodecahedron' | 'zonohedron';
		speed: number;
		cameraZ: number;
};

const dodecahedronOption = document.querySelector<HTMLInputElement>('#dodecahedronOption');
const zonohedronOption = document.querySelector<HTMLInputElement>('#zonohedronOption');

const geometry = Rx.Observable
		.merge(Rx.Observable.fromEvent(dodecahedronOption, 'change'),
					 Rx.Observable.fromEvent(zonohedronOption, 'change'))
		.map((event: InputEvent) => (event.target as HTMLInputElement).value)
		.startWith('zonohedron');

function linearKeyControl(initialValue: number, inc: number, incKeys: string[], decKeys: string[]) {
		const dec = 1 / inc;

		const plus = Rx.Observable.fromEvent(document, 'keypress')
				.filter((event: KeyboardEvent) => incKeys.includes(event.key))
				.map(() => inc)

		const minus = Rx.Observable.fromEvent(document, 'keypress')
				.filter((event: KeyboardEvent) => decKeys.includes(event.key))
				.map(() => dec)

		return Rx.Observable
				.merge(plus, minus)
				.startWith(1)
				.scan((value, multipler) => ((value * multipler)), initialValue);
}

const speed = linearKeyControl(0.001, Math.sqrt(2), ['+', '='], ['-']);
const cameraZ = linearKeyControl(6, Math.sqrt(Math.sqrt(2)), ['s'], ['w']);

const input = Rx.Observable.combineLatest(
		geometry, speed, cameraZ, 
		(geometry, speed, cameraZ) => ({ geometry, speed, cameraZ })
);

export default input;
