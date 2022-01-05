import { Observable } from 'rxjs-compat';

export type Delta = {
		x: number;
		y: number;
}

export type Translation = {
		type: 'translation';
		x: number;
		y: number;
}

export type Rotation = {
		type: 'rotation';
		angle: number;
}

export type Scale = {
		type: 'scale';
		scale: number;
}

export type Transformation = Translation | Rotation | Scale;

function eventToDelta(evt: MouseEvent): Delta {
		evt.preventDefault();
		const x = evt.offsetX, y = evt.offsetY;
		return { x, y };
}

export default function mouseEvents(node: Node): Observable<Transformation> {
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
										return { type: 'translation', x: 0, y:0 } as Translation;
								}

								return { type: 'translation', x, y } as Translation;
						});
		}).startWith({ type: 'translation', x: 0, y: 0 });
}
