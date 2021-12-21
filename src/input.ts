import * as three from 'three';
import * as Rx from 'rxjs-compat';

export type Input = {
		geometry: 'dodecahedron' | 'zonohedron' | 'icosahedron';
		speed: number;
		cameraZ: number;
};

function createGeometryPicker(options: string[]): { cleanup: () => void, inputs: HTMLInputElement[] } {
		const controls = document.getElementById('controls');
		if (!controls) {
				throw new Error("can't find controls");
		}

		const picker = document.createElement('div')
		picker.setAttribute('class', 'form-group');

		const header = document.createElement('h4');
		header.appendChild(document.createTextNode('Geometry'));
		picker.appendChild(header);

		const inputs = options.map((option: string) => {
				const container = document.createElement('div');
				container.setAttribute('class', 'form-check form-check-inline');

				const input = document.createElement('input');
				input.setAttribute('class', 'form-check-input');
				input.setAttribute('type', 'radio');
				input.setAttribute('name', 'geometryOptions');
				input.setAttribute('id', `${option}Option`);
				input.setAttribute('value', option);
				input.setAttribute('checked', '');
				container.appendChild(input);

				const label = document.createElement('label');
				label.setAttribute('class', 'form-check-label');
				label.setAttribute('for', `${option}Option`);
				label.appendChild(document.createTextNode(option));
				container.appendChild(label);

				picker.appendChild(container);

				return input;
		});

		controls.appendChild(picker);

		return { 
				cleanup: () => {
						controls.removeChild(picker);
				}, 
				inputs,
		};
}

function geometry() {
		let picker: { cleanup: () => void, inputs: HTMLInputElement[] };
		return new Rx.Observable((subscriber: Rx.Subscriber<string>) => {
				if (!picker) {
						picker = createGeometryPicker(['dodecahedron', 'zonohedron', 'icosahedron']);
				}
				const { cleanup, inputs } = picker;

				const inputObservables = inputs.map((input: HTMLInputElement) => Rx.Observable.fromEvent(input, 'change'));
				const geometry = Rx.Observable
						.merge.apply(null, inputObservables)
						.map((event: InputEvent) => (event.target as HTMLInputElement).value)
						.startWith('icosahedron');
				geometry.subscribe(subscriber);

				return cleanup;
		})
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
		geometry(), speed, cameraZ, 
		(geometry, speed, cameraZ) => ({ geometry, speed, cameraZ })
);

export default input;
