import { Observable, Subscriber } from 'rxjs-compat';


export interface Option {
		id: string;
		title: string;
}

class Control {
		picker: HTMLElement;
		inputs: HTMLElement[];
		defaultOption: string;

		constructor(
				parent: Node,
				pickerId: string,
				pickerTitle: string,
				options: Option[],
				defaultOption: string
		) {
				this.picker = document.createElement('div');
				this.picker.setAttribute('class', 'form-group');

				const header = document.createElement('h4');
				header.appendChild(document.createTextNode(pickerTitle));
				this.picker.appendChild(header);

				this.inputs = options.map(({ id, title }: Option) => {
						const container = document.createElement('div');
						container.setAttribute('class', 'form-check form-check-inline');

						const input = document.createElement('input');
						input.setAttribute('class', 'form-check-input');
						input.setAttribute('type', 'radio');
						input.setAttribute('name', pickerId);
						input.setAttribute('id', id);
						input.setAttribute('value', id);
						if (id === defaultOption) {
								input.setAttribute('checked', '');
						}
						container.appendChild(input);

						const label = document.createElement('label');
						label.setAttribute('class', 'form-check-label');
						label.setAttribute('for', id);
						label.appendChild(document.createTextNode(title));
						container.appendChild(label);

						this.picker.appendChild(container);

						return input;
				});

				parent.appendChild(this.picker);
		}

		get observable() {
				const observables = this.inputs.map((input: HTMLInputElement) =>
																						Observable.fromEvent(input, 'change')
																						.map((event: InputEvent) => (event.target as HTMLInputElement).value));
				return Observable.merge(...observables).startWith(this.defaultOption);
		}

		cleanup() {
				this.picker.remove();
		}
}

export default function optionPicker(
				parent: Node,
				pickerId: string,
				pickerTitle: string,
				options: Option[],
				defaultOption: string
		): Observable<string> {
		return new Observable((subscriber: Subscriber<string>) => {
				const control = new Control(parent, pickerId, pickerTitle, options, defaultOption);
				const subscription = control.observable.subscribe(subscriber);
				return function () {
						subscription.unsubscribe();
						control.cleanup();
				}
		});
}
