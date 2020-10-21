import * as Rx from 'rxjs-compat';

const spacebarDown = Rx.Observable.fromEvent(document, 'keydown')
		.filter((event: KeyboardEvent) => event.key === ' ')
		.map(() => true);

const spacebarUp = Rx.Observable.fromEvent(document, 'keyup')
		.filter((event: KeyboardEvent) => event.key === ' ')
		.map(() => false)
		.startWith(false);

const input = Rx.Observable.merge(spacebarDown, spacebarUp);

export default input;
