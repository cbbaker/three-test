import { Observable, Subscriber } from 'rxjs-compat';

class Checkbox {
		parent: Node;
		group: HTMLElement;
		input: HTMLInputElement;

		constructor(parent: Node,
								id: string,
								title: string,
								value: boolean) {
				this.parent = parent;
				this.group = document.createElement('div');
				this.group.setAttribute('class', 'form-group form-check');
				
				this.input = document.createElement('input');
				this.input.setAttribute('type', 'checkbox');
				this.input.setAttribute('class', 'form-check-input');
				this.input.setAttribute('id', id);
				if (value) {
						this.input.setAttribute('checked', '');
				}
				this.group.appendChild(this.input);

				const label = document.createElement('label');
				label.setAttribute('for', id);
				label.setAttribute('class', 'form-check-label');
				label.appendChild(document.createTextNode(title));
				this.group.appendChild(label);
				this.parent.appendChild(this.group);
				
		}

		get observable() {
				return Observable
						.fromEvent(this.input, 'input')
						.map((event: Event) => (event.target as HTMLInputElement).checked)
						.startWith(this.input.value);
		}

		cleanup() {
				this.group.remove();
		}
}

export default function checkbox(parent: Node,
															 id: string,
															 title: string,
															 value: boolean): Observable<boolean> {
		return new Observable((subscriber: Subscriber<boolean>) => {
				const checkbox = new Checkbox(parent, id, title, value);
				const subscription = checkbox.observable.subscribe(subscriber);
				subscriber.next(value);
				return function() {
						subscription.unsubscribe();
						checkbox.cleanup();
				}
		});
}
