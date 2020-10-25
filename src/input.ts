import * as Rx from 'rxjs-compat';

export type Input = Rx.Observable<number>;

const inc = Math.sqrt(2);
const dec = 1 / inc;

const plus = Rx.Observable.fromEvent(document, 'keypress')
		.filter((event: KeyboardEvent) => event.key === '+' || event.key === '=')
		.map(() => inc)

const minus = Rx.Observable.fromEvent(document, 'keypress')
		.filter((event: KeyboardEvent) => event.key === '-')
		.map(() => dec)

const input: Input = Rx.Observable
		.merge(plus, minus)
		.startWith(1)
		.scan((previous, multipler) => previous * multipler, 0.001);

input.subscribe(console.log)

export default input;
