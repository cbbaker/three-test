import { Observable, Subscriber } from 'rxjs-compat';

class Slider {
		parent: Node;
		label: HTMLElement;
		input: HTMLInputElement;

		constructor(parent: Node,
								id: string,
								title: string,
								min: number,
								max: number,
								step: number,
								value: number) {
				this.parent =  parent;
				this.label = document.createElement('label');
				this.label.setAttribute('for', id);
				this.label.appendChild(document.createTextNode(title));
				parent.appendChild(this.label);
				
				this.input = document.createElement('input');
				this.input.setAttribute('type', 'range');
				this.input.setAttribute('class', 'form-control-range');
				this.input.setAttribute('id', id);
				this.input.setAttribute('name', id);
				this.input.setAttribute('min', min.toString());
				this.input.setAttribute('max', max.toString());
				this.input.setAttribute('step', step.toString());
				this.input.setAttribute('value', value.toString());
				parent.appendChild(this.input);
		}

		get observable() {
				return Observable
						.fromEvent(this.input, 'input')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(this.input.value));
		}

		cleanup() {
				this.label.remove();
				this.input.remove();
		}
}

export default function slider(parent: Node,
															 id: string,
															 title: string,
															 min: number,
															 max: number,
															 step: number,
															 value: number): Observable<number> {
		return new Observable((subscriber: Subscriber<number>) => {
				const slider = new Slider(parent, id, title, min, max, step, value);
				const subscription = slider.observable.subscribe(subscriber);
				subscriber.next(value);
				return function() {
						subscription.unsubscribe();
						slider.cleanup();
				}
		});
}
