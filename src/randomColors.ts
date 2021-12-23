import { Observable, Subscriber } from 'rxjs-compat';
import * as three from 'three';
import randNormal from './randNormal';
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

export function computeColor({ saturation, luminosity }: ColorState): three.Color {
		const sat = randNormal(saturation.mu, saturation.sigma);
		const lum = randNormal(luminosity.mu, luminosity.sigma);
		const clamp = (val: number) => Math.max(Math.min(val, 1), 0);

		return new three.Color().setHSL(Math.random(), clamp(sat), clamp(lum));
}

