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
				console.log('outer subscribe', subscriber);
				let outerSub: Rx.Subscription;
				outerSub = objType.subscribe({
						next: (objType: string) => {
								console.log('got next', objType);
								if (innerSub) {
										innerSub.unsubscribe();
										innerSub = undefined;
								};
								const obs = controls[objType];
								console.log('found obs', obs);
								if (obs) {
										console.log('inner subscribe');
										innerSub = obs.subscribe({
												next: (value: Controls) => {
														console.log('inner next', subscriber, value);
														subscriber.next(value);
												},
												error: (error: Error) =>
														subscriber.error(error),
												complete: () => {
														console.log('inner complete');
														subscriber.complete();
												},
										})
								}
						},
						error: (error: Error) => {
								subscriber.error(error);
						},
						complete: () => {
								console.log('got complete')
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


