import * as sinon from 'sinon';
import * as chai from 'chai';
const { expect } = chai;
import * as  sinonChai from 'sinon-chai';
import * as Rx from 'rxjs-compat';
import objectControls from './objectControls';

chai.use(sinonChai);

describe('objectControls', () => {
		const sandbox = sinon.createSandbox();
		afterEach(() => {
				sandbox.reset();
		});

		context('when there are no controls', () => {
				it("doesn't emit values", (done) => {
						const controls = objectControls(Rx.Observable.from(['test1', 'test2']), {});
						const subscriber = sandbox.spy({
								next: () => {},
								error: () => {},
								complete: () => {
										done();
								},
						});
						
						controls.subscribe(subscriber);
						expect(subscriber.next).not.to.have.been.called;
						expect(subscriber.error).not.to.have.been.called;
						expect(subscriber.complete).to.have.been.called;
				});
		});

		context('when there is one control', () => {
				it.only("emits values from the control", (done) => {
						const controls = objectControls(
								Rx.Observable.from(['test1', 'test2']), {
										test1: Rx.Observable.from([{ objType: 'test1', value: 1}]),
										test2: Rx.Observable.from([{ objType: 'test2', value: 2}]),
								});
						const subscriber = sandbox.spy({
								next: () => {},
								error: () => {},
								complete: () => {
								},
						});
						
						controls.subscribe(subscriber);
						expect(subscriber.next).to.have.been.calledTwice;
						expect(subscriber.next.firstCall).to.have.been.calledWith({objType: 'test1', value: 1})
						expect(subscriber.next.secondCall).to.have.been.calledWith({objType: 'test2', value: 2})
						expect(subscriber.error).not.to.have.been.called;
						expect(subscriber.complete).to.have.been.called;
						done();
				});
		});
});
