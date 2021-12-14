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
		})

		context('when there are no controls', () => {
				it("doesn't emit values", (done) => {
						const controls = objectControls(Rx.Observable.from(['test1', 'test2']), {});
						const subscriber = sandbox.spy({
								next: () => {},
								error: () => {},
								complete: () => {},
						});
						
						controls.subscribe(subscriber);
						expect(subscriber.next).not.to.have.been.called;
						expect(subscriber.error).not.to.have.been.called;
						expect(subscriber.complete).to.have.been.called;
						done();
				});
		});
});
