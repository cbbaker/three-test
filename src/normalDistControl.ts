import { Observable, Subscriber } from 'rxjs-compat';
import slider from './slider';

export type NormalDist = {
		mu: number;
		sigma: number;
}

class Control {
		parent: Node;
		group: HTMLElement;
		mu: Observable<number>;
		sigma: Observable<number>;

		constructor(parent: Node, baseName: string) {
				this.parent = parent;
				this.group = document.createElement('div');
				this.group.setAttribute('class', 'form-group');
				const header = document.createElement('h4');
				header.appendChild(document.createTextNode(baseName));
				this.group.appendChild(header);

				this.mu = slider(this.group, `${baseName}Average`, 'Average', 0, 1, 0.01, 0.5);
				this.sigma = slider(this.group, `${baseName}StdDev`, 'StdDev', 0, 1, 0.01, 0.02);

				parent.appendChild(this.group);
		}

		get observable() {
				return Observable.combineLatest(this.mu, this.sigma).map(([mu, sigma]) => ({ mu, sigma }));
		}

		cleanup() {
				this.parent.removeChild(this.group);
		}
}

export default function normalDistControl(parent: Node, baseName: string): Observable<NormalDist> {
		return new Observable((subscriber: Subscriber<NormalDist>) => {
				const control = new Control(parent, baseName);
				const subscription = control.observable.subscribe(subscriber);
				return function() {
						subscription.unsubscribe();
						control.cleanup();
				}
		})
}
