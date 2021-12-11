import * as Rx from 'rxjs-compat';



export type Input = {
		geometry: 'dodecahedron' | 'zonohedron';
		speed: number;
};

const dodecahedronOption = document.querySelector<HTMLInputElement>('#dodecahedronOption');
const zonohedronOption = document.querySelector<HTMLInputElement>('#zonohedronOption');

const geometry = Rx.Observable
		.merge(Rx.Observable.fromEvent(dodecahedronOption, 'change'),
					 Rx.Observable.fromEvent(zonohedronOption, 'change'))
		.map((event: InputEvent) => (event.target as HTMLInputElement).value)
		.startWith('zonohedron');

geometry.subscribe(console.log);

const inc = Math.sqrt(2);
const dec = 1 / inc;

const plus = Rx.Observable.fromEvent(document, 'keypress')
		.filter((event: KeyboardEvent) => event.key === '+' || event.key === '=')
		.map(() => inc)

const minus = Rx.Observable.fromEvent(document, 'keypress')
		.filter((event: KeyboardEvent) => event.key === '-')
		.map(() => dec)

const speed = Rx.Observable
		.merge(plus, minus)
		.startWith(1)
		.scan((speed, multipler) => ((speed * multipler)), 0.001);

const input = Rx.Observable.combineLatest(geometry, speed, (geometry, speed) => ({geometry, speed}));

input.subscribe(console.log)

export default input;
