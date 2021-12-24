import * as Rx from 'rxjs-compat';

export default function objectControls<T>(
		objType: Rx.Observable<string>, 
		controls: Record<string, Rx.Observable<T>>
): Rx.Observable<T> {
		let innerSub: Rx.Subscription;
		return new Rx.Observable((subscriber: Rx.Observer<T>) => {
				let outerSub: Rx.Subscription;
				outerSub = objType.subscribe({
						next: (objType: string) => {
								if (innerSub) {
										innerSub.unsubscribe();
										innerSub = undefined;
								};
								const obs = controls[objType];
								if (obs) {
										innerSub = obs.subscribe({
												next: (value: T) => {
														subscriber.next(value);
												},
												error: (error: Error) =>
														subscriber.error(error),
												complete: () => {
														subscriber.complete();
												},
										})
								}
						},
						error: (error: Error) => {
								subscriber.error(error);
						},
						complete: () => {
								if (innerSub) {
										innerSub.unsubscribe();
								}
								if (outerSub) {
										outerSub.unsubscribe();
								}
								subscriber.complete();
						},
				});
				return function () {
						if (innerSub) {
								innerSub.unsubscribe();
						}
						if (outerSub) {
								outerSub.unsubscribe();
						}
						
				}
		});
}


