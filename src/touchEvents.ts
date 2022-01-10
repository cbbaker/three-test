import { Observable } from 'rxjs-compat';
import { Gesture } from './gestures.ts';

type Touch = {
		identifier: number;
		pageX: number;
		pageY: number;
}
type TouchState = {
		ongoingTouches: Map<number, Touch>;
		gesture: Gesture;
}

type TouchStateUpdate = (state: TouchState) => TouchState;

const zero: Gesture = { type: 'move', x: 0, y: 0 };

function findTouch(identifier: number, list: TouchList, defaultTouch: Touch): Touch {
		for (let i = 0; i < list.length; i++) {
				const touch = list.item(i);
				if (touch.identifier === identifier) {
						return { identifier, pageX: touch.pageX, pageY: touch.pageY };
				}
		}
		return defaultTouch;
}

function updateTouches(ongoingTouches: Map<number, Touch>, list: TouchList): void {
		for (let i = 0; i < list.length; i++) {
				const { identifier, pageX, pageY } = list.item(i);
				ongoingTouches.set(identifier, { identifier, pageX, pageY });
		}
}

function updateStart(evt: TouchEvent): TouchStateUpdate {
		return function({ ongoingTouches }: TouchState): TouchState {
				evt.preventDefault();

				const touches = evt.changedTouches;

				for (let i = 0; i < touches.length; ++i) {
						const { identifier, pageX, pageY } = touches.item(i);
						ongoingTouches.set(identifier, { identifier, pageX, pageY });
				}

				return { ongoingTouches, gesture: zero };
		}
}

function computeMove(oldTouch: Touch, newTouch: Touch): Gesture {
		const x = newTouch.pageX - oldTouch.pageX;
		const y = newTouch.pageY - oldTouch.pageY;
		return { type: 'move', x, y };
}

function computeTwirl(oldTouches: [Touch, Touch], newTouches: [Touch, Touch]): Gesture {
		const oldDX = oldTouches[1].pageX - oldTouches[0].pageX;
		const oldDY = oldTouches[1].pageY - oldTouches[0].pageY;
		const oldMag = Math.sqrt(oldDX * oldDX + oldDY * oldDY);
		const oldAngle = Math.atan2(oldDY, oldDX);
		
		const newDX = newTouches[1].pageX - newTouches[0].pageX;
		const newDY = newTouches[1].pageY - newTouches[0].pageY;
		const newMag = Math.sqrt(newDX * newDX + newDY * newDY);
		const newAngle = Math.atan2(newDY, newDX);

		return { type: 'twirl', angle: newAngle - oldAngle, scale: newMag / oldMag };
}

function updateMove(evt: TouchEvent): TouchStateUpdate {
		return function({ ongoingTouches }: TouchState): TouchState {

				const touches = evt.changedTouches;

				if (ongoingTouches.size === 1) {
						const oldTouch = ongoingTouches.values().next().value;
						const newTouch = findTouch(oldTouch.identifier, evt.changedTouches, oldTouch);

						const gesture = computeMove(oldTouch, newTouch);
						updateTouches(ongoingTouches, touches);
						return { ongoingTouches, gesture };
				} 

				if (ongoingTouches.size === 2) {
						const oldTouches = [];
						const values = ongoingTouches.values();
						oldTouches.push(values.next().value);
						oldTouches.push(values.next().value);
						const newTouches = oldTouches.map((touch: Touch) => findTouch(touch.identifier, touches, touch));

						const gesture = computeTwirl(oldTouches as [Touch, Touch], newTouches as [Touch, Touch]);
						updateTouches(ongoingTouches, touches);
						return { ongoingTouches, gesture };
				}

				return { ongoingTouches, gesture: zero };
		}
}

function updateStop(evt: TouchEvent): TouchStateUpdate {
		return function({ ongoingTouches }: TouchState): TouchState {

				const touches = evt.changedTouches;
				
				for (let i = 0; i < touches.length; ++i) {
						const { identifier } = touches.item(i);
						ongoingTouches.delete(identifier);
				}

				return { ongoingTouches, gesture: zero };
		}
}

export default function touchEvents(node: Node): Observable<Gesture> {
		const start = Observable.fromEvent(node, 'touchstart')
				.map(updateStart);
		const move = Observable.fromEvent(document, 'touchmove')
				.map(updateMove);
		const end = Observable.merge(Observable.fromEvent(document, 'touchend'), 
																 Observable.fromEvent(document, 'touchcancel'))
				.map(updateStop);

		return Observable.merge(start, move, end)
				.scan((state: TouchState, update: TouchStateUpdate) => {
				return update(state);
		}, { ongoingTouches: new Map<number, Touch>(), gesture: zero })
				.map(({ gesture }) => gesture)
				.startWith(zero);
}
