import { Observable, Subscriber } from 'rxjs-compat';
import * as three from 'three';
import normalDistControl, { NormalDist } from './normalDistControl';

export type ColorState = {
		saturation: NormalDist;
		luminosity: NormalDist;
};

class Control {
		parent: Node;
		saturation: Observable<NormalDist>;
		luminosity: Observable<NormalDist>;

		constructor(parent: Node) {
				this.parent = parent;
				this.saturation = normalDistControl(parent, 'Saturation');
				this.luminosity = normalDistControl(parent, 'Luminosity');
		}

		get observable() {
				return Observable
				.combineLatest(this.saturation, this.luminosity)
				.map(([saturation, luminosity]) => ({ saturation, luminosity }));
		}
}

export default function randomColors(parent: Node): Observable<ColorState> {
		return new Observable((subscriber: Subscriber<ColorState>) => {
				const control = new Control(parent);
				const subscription = control.observable.subscribe(subscriber);
				return function() {
						subscription.unsubscribe();
				}
		})
}
