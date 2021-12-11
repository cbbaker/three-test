import * as three from 'three';
import * as Immutable from 'immutable';
import { Input } from './input';
import { Clock } from './clock';
import QuaternionSpline from './quaternionSpline';

type Params = {
		spline?: QuaternionSpline;
		time?: number;
}

export class AnimatedOrientation extends Immutable.Record({
		spline: new QuaternionSpline([]),
		time: 0,
}) {
		constructor(qControls: three.Quaternion[] = []) {
				const spline = new QuaternionSpline(qControls);
				super({ spline });
		}

		with(values: Params) {
				return this.merge(values) as this;
		}

		process({ delta }: Clock, { speed }: Input) {
				const { time, spline: { end } } = this;
				let newTime = time + delta * speed;
				while (newTime > end) {
						newTime -= end;
				}

				return this.with({ time: newTime });
		}
}
