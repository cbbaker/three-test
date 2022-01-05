import * as three from 'three';
import * as Rx from 'rxjs-compat';
import mouseEvents, { Transformation } from './mouseEvents';
import coldToHot from './coldToHot';
import optionPicker, { Option } from './optionPicker'

export type Input = {
		geometry: string;
		speed: number;
		cameraZ: number;
		transformation: Transformation;
};


function geometry() {
		const controls = document.getElementById('controls');
		if (!controls) {
				throw new Error("can't find controls");
		}

		const options = [
				{ id: 'dodecahedron', title: 'Dodecahedron' },
				{ id: 'icosahedron', title: 'Icosahedron' },
				{ id: 'zonohedron', title: 'Zonohedron' },
		];

		return coldToHot(optionPicker(controls, 'geometry', 'Geometry', options, 'dodecahedron'));
};


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
		geometry(), speed, cameraZ, mouseEvents(document.getElementById('canvas')),
		(geometry, speed, cameraZ, transformation) => ({ geometry, speed, cameraZ, transformation })
);

export default input;
