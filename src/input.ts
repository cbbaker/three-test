import { Observable, BehaviorSubject } from 'rxjs-compat';
import { Gesture } from './gestures';
import mouseEvents from './mouseEvents';
import touchEvents from './touchEvents';
import optionPicker from './optionPicker'

export type Input = {
		geometry: string;
		speed: 1;
		gesture: Gesture;
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

		const geometryPicker = new BehaviorSubject<string>('dodecahedron');
		optionPicker(controls, 'geometry', 'Geometry', options, 'dodecahedron').subscribe(geometryPicker);

		return geometryPicker;
};


// function linearKeyControl(initialValue: number, inc: number, incKeys: string[], decKeys: string[]) {
// 		const dec = 1 / inc;

// 		const plus = Rx.Observable.fromEvent(document, 'keypress')
// 				.filter((event: KeyboardEvent) => incKeys.includes(event.key))
// 				.map(() => inc)

// 		const minus = Rx.Observable.fromEvent(document, 'keypress')
// 				.filter((event: KeyboardEvent) => decKeys.includes(event.key))
// 				.map(() => dec)

// 		return Rx.Observable
// 				.merge(plus, minus)
// 				.startWith(1)
// 				.scan((value, multipler) => ((value * multipler)), initialValue);
// }

// const speed = linearKeyControl(0.001, Math.sqrt(2), ['+', '='], ['-']);
// const cameraZ = linearKeyControl(6, Math.sqrt(Math.sqrt(2)), ['s'], ['w']);

function gesture() {
		const gesture = new BehaviorSubject<Gesture>({ type: 'move', x: 0, y: 0 });
		const canvas = document.getElementById('canvas')
		Observable.merge(mouseEvents(canvas), touchEvents(canvas)).subscribe(gesture);
		return gesture;
}

const input = Observable.combineLatest(
		geometry(), gesture(),
		(geometry, gesture) => ({ geometry, gesture, speed: 1 })
);

export default input;
