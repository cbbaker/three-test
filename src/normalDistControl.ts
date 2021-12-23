import { Observable, Subscriber } from 'rxjs-compat';
import formGroup from './formGroup';
import slider from './slider';

export type NormalDist = {
		mu: number;
		sigma: number;
}

export default function normalDistControl(parent: Node, baseName: string): Observable<NormalDist> {
		return formGroup(parent, baseName, (parent: Node) => {
				const mu = slider(parent, `${baseName}Average`, 'Average', 0, 1, 0.01, 0.5);
				const sigma = slider(parent, `${baseName}StdDev`, 'StdDev', 0, 1, 0.01, 0.02);

				return Observable.combineLatest(mu, sigma).map(([mu, sigma]) => ({ mu, sigma }))
		});
}
