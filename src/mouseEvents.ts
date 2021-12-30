import { Observable } from 'rxjs-compat';

export type Delta = {
		x: number;
		y: number;
		lastX: number;
		lastY: number;
}

export default function mouseEvents(node: Node): Observable<Delta> {
		return Observable.fromEvent(node, 'mousedown').concatMap((evt: MouseEvent) => {
				evt.preventDefault();

				let lastX = evt.offsetX, lastY = evt.offsetY;

				const movement = Observable
						.fromEvent(document, 'mousemove')
						.takeUntil(Observable.fromEvent(document, 'mouseup'))
						.scan(({ lastX, lastY }, evt: MouseEvent) => {
								evt.preventDefault();
								const x = evt.offsetX - lastX, y = evt.offsetY - lastY;
								return { x, y, lastX: evt.offsetX, lastY: evt.offsetY };
						}, { x: 0, y: 0, lastX, lastY });
				return Observable.concat(movement, Observable.from([{ x: 0, y: 0, lastX: 0, lastY: 0}]));
		}).startWith({ x: 0, y: 0, lastX: 0, lastY: 0 });
}
