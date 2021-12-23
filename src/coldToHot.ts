import { Observable, BehaviorSubject } from 'rxjs-compat';

export default function makeHotRefCounted<T>(cold: Observable<T>): Observable<T> {
  const subject = new BehaviorSubject<T>(undefined);
  const mainSub = cold.subscribe(subject);
  let refs = 0;
  return new Observable<T>((observer) => {
    refs++;
    let sub = subject.subscribe(observer);
    return () => {
      refs--;
      if (refs === 0) mainSub.unsubscribe();
      sub.unsubscribe();
    };
  });
}
