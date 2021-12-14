import * as Rx from 'rxjs-compat';

export interface Controls {
		objType: string;
};

export default function objectControls(
		objType: Rx.Observable<string>, 
		controls: Record<string, Rx.Observable<Controls>>
): Rx.Observable<Controls> {
		let innerSub: Rx.Subscription;
		return new Rx.Observable((subscriber: Rx.Observer<Controls>) => {
				let outerSub: Rx.Subscription;
				outerSub = objType.subscribe({
						next: (objType: string) => {
								if (innerSub) {
										innerSub.unsubscribe();
										innerSub = undefined;
								};
								const obs = controls.objType;
								if (obs) {
										innerSub = obs.subscribe({
												next: (value: Controls) =>
														subscriber.next(value),
												error: (error: Error) =>
														subscriber.error(error),
												complete: () =>
														subscriber.complete(),
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
		});
}


