import { Observable } from 'rxjs-compat';
import { Gesture } from './gestures.ts';

type Delta = {
		x: number;
		y: number;
}

function eventToDelta(evt: MouseEvent): Delta {
		evt.preventDefault();
		const x = evt.offsetX, y = evt.offsetY;
		return { x, y };
}

const zero: Gesture = { type: 'move', x: 0, y: 0 };

export default function mouseEvents(node: Node): Observable<Gesture> {
		return Observable.fromEvent(node, 'mousedown').concatMap((evt: MouseEvent) => {
				const start = Observable.from([eventToDelta(evt)]);
				const moves = Observable.fromEvent(document, 'mousemove')
						.takeUntil(Observable.fromEvent(document, 'mouseup'))
						.map(eventToDelta);
				
				return Observable.concat(start, moves)
						.pairwise()
						.map(([last, cur]: Delta[]) => {
								const x = cur.x - last.x;
								const y = cur.y - last.y;

								if (x === undefined || y === undefined) {
										return zero;
								}

								return { ...zero, x, y };
						});
		}).startWith(zero);
}
