import * as Rx from 'rxjs-compat';
import * as three from 'three';
import normalDistControl, { NormalDist } from './normalDistControl';

export type ColorState = {
		saturation: NormalDist;
		luminosity: NormalDist;
};

export default function randomColors(): Rx.Observable<ColorState> {
		const sa = document.querySelector<HTMLInputElement>('#saturationAverage');
		const ss = document.querySelector<HTMLInputElement>('#saturationStdDev');
		const saturation = normalDistControl(sa, ss);

		const la = document.querySelector<HTMLInputElement>('#luminosityAverage');
		const ls = document.querySelector<HTMLInputElement>('#luminosityStdDev');
		const luminosity = normalDistControl(la, ls);

		return Rx.Observable
				.combineLatest(saturation, luminosity)
				.map(([saturation, luminosity]) => ({saturation, luminosity,}));
}
