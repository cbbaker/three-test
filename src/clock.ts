import { Record } from 'immutable';
import { Observable, Scheduler } from 'rxjs-compat';

type ClockParams = {
		time: number,
		delta: number,
}

export class Clock extends Record({ time: 0, delta: 0 }) {
		constructor(params?: ClockParams) {
				params ? super(params) : super();
		}

		get fps() {
				return 1.0 / this.delta;
		}
}

const clock = Observable
    .interval(0, Scheduler.animationFrame)
    .scan(
        previous => {
            const time = performance.now();
            return previous.merge({
                time,
                delta: time - previous.get("time")
            });
        },
				new Clock({
            time: performance.now(),
            delta: 0
        })
    );

export default clock;
