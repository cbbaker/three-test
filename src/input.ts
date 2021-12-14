import * as three from 'three';
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

export type NormalDist = {
		mu: number;
		sigma: number;
}

export type ColorState = {
		saturation: NormalDist;
		luminosity: NormalDist;
}

export type DodecahedronControlState = {
		stellationSize: number;
}

export type ZonohedronControlState = {
		points: three.Vector3[];
}

function normalDistControl(avgControl?: HTMLInputElement, stdDevControl?: HTMLInputElement): Rx.Observable<NormalDist> {
		if (avgControl && stdDevControl) {
				const mu = Rx.Observable
						.fromEvent(avgControl, 'change')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(avgControl.value));
				const sigma = Rx.Observable
						.fromEvent(stdDevControl, 'change')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(stdDevControl.value));
				return Rx.Observable.combineLatest(mu, sigma).map(([mu, sigma]) => ({ mu, sigma}));
		}

		throw new Error("Can't find range sliders")
}

export function initColors(): Rx.Observable<ColorState> {
		const sa = document.querySelector<HTMLInputElement>('#saturationAverage');
		const ss = document.querySelector<HTMLInputElement>('#saturationStdDev');
		const saturation = normalDistControl(sa, ss);

		const la = document.querySelector<HTMLInputElement>('#luminosityAverage');
		const ls = document.querySelector<HTMLInputElement>('#luminosityStdDev');
		const luminosity = normalDistControl(la, ls);

		return Rx.Observable
				.combineLatest(saturation, luminosity)
				.map(([saturation, luminosity]) => ({saturation, luminosity,}));
}

export function initDodecahedronControls(): Rx.Observable<DodecahedronControlState> {
		const st = document.querySelector<HTMLInputElement>('#stellationSize');
		if (st) {
				return Rx.Observable
						.fromEvent(st, 'input')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(st.value))
						.map(stellationSize => ({ stellationSize }));
		}

		throw new Error("Can't find range sliders")
}

function oddPolar(n: number): three.Vector3[] {
		const angle = 2 * Math.PI / n;
		const angleOffset = 0.5 * angle;
		const sideLength = Math.sqrt(2 * (1 - Math.cos(angle)));
		const zOffset = Math.sqrt(3) * 0.5 * sideLength;
		const top = [] as three.Vector3[];
		for (let i = 0; i < n; ++i) {
				const angle = 2 * Math.PI * i / n;
				const point = new three.Vector3(Math.cos(angle), Math.sin(angle), 1);
				top.push(point);
		}
		return top;
}

function evenPolar(n: number): three.Vector3[] {
		const angle = 2 * Math.PI / n;
		const angleOffset = 0.5 * angle;
		const sideLength = Math.sqrt(2 * (1 - Math.cos(angle)));
		const zOffset = 0.5 * sideLength;
		const top = [] as three.Vector3[];
		for (let i = 0; i < n; ++i) {
				const angle = 2 * Math.PI * i / n;
				const point = new three.Vector3(Math.cos(angle), Math.sin(angle), 1);
				top.push(point);
		}
		return top;
}

function polarZonohedron(n: number): three.Vector3[] {
		if (n & 1) {
				return oddPolar(n);
		}

		return evenPolar(n);
}

export function initZonohedronControls(): Rx.Observable<ZonohedronControlState> {
		const root2over2 = 1.0/Math.sqrt(2);
		const p1 = [
				new three.Vector3(1, root2over2, 0),
				new three.Vector3(1, -root2over2, 0),
				new three.Vector3(0,  root2over2, 1),
				new three.Vector3(0, -root2over2, 1),
		]

		const phi = (1 + Math.sqrt(5)) / 2;
		const p2 = [
				new three.Vector3(0, 1, phi),
				new three.Vector3(0, 1, -phi),
				new three.Vector3(1, phi, 0),
				new three.Vector3(1, -phi, 0),
				new three.Vector3(phi, 0, 1),
				new three.Vector3(-phi, 0, 1),
		]

		const points = true ? p2 : p1;

		// const points = polarZonohedron(5);

		return Rx.Observable.from([{ points }]);
}


export default input;
