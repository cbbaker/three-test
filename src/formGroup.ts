import { Observable, Subscriber, Subscription } from 'rxjs-compat';

export default function formGroup<T>(
		parent: Node,
		title: string,
		createChildren: (parent: Node) => Observable<T>
): Observable<T> {
		return new Observable((subscriber: Subscriber<T>) => {
				const group = document.createElement('div');
				group.setAttribute('class', 'form-group');
				const header = document.createElement('h4');
				header.appendChild(document.createTextNode(title));
				group.appendChild(header);
				parent.appendChild(group);

				const subscription = createChildren(group).subscribe(subscriber);
				return function() {
						subscription.unsubscribe();
						group.remove();
				}
		});
}

