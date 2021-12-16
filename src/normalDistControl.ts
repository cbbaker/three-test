import * as Rx from 'rxjs-compat';

export type NormalDist = {
		mu: number;
		sigma: number;
}

export default function normalDistControl(avgControl?: HTMLInputElement, stdDevControl?: HTMLInputElement): Rx.Observable<NormalDist> {
		if (avgControl && stdDevControl) {
				const mu = Rx.Observable
						.fromEvent(avgControl, 'change')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(avgControl.value));
				const sigma = Rx.Observable
						.fromEvent(stdDevControl, 'change')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(stdDevControl.value));
				return Rx.Observable.combineLatest(mu, sigma).map(([mu, sigma]) => ({ mu, sigma}));
		}

		throw new Error("Can't find range sliders")
}

