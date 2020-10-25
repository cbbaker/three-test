import * as Rx from 'rxjs-compat';
import * as three from 'three';
import * as Immutable from 'immutable';
import QuaternionSpline from './quaternionSpline';

type CubeParams = {
		spline?: QuaternionSpline;
		time?: number;
		total?: number;
}

export class Cube extends Immutable.Record({
		spline: new QuaternionSpline([]),
		time: 0,
		total: 5000,
}) {
		constructor(qControls: three.Quaternion[] = []) {
				const spline = new QuaternionSpline(qControls);
				super({ spline });
		}

		with(values: CubeParams) {
				return this.merge(values) as this;
		}
}

