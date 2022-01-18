import { Observable, Subscriber, Subscription } from 'rxjs-compat';
import * as three from 'three';
import bitGenerator from './bitGenerator';
import coldToHot from './coldToHot';
import formGroup from './formGroup';
import optionPicker, { Option } from './optionPicker';
import slider from './slider';

export type ControlState = {
		points: three.Vector3[];
}

type PolarParams = {
		type: 'polar';
		count: number;
		prismHeight: number;
}

type RhombicParams = {
		type: 'rhombic';
		count: 4 | 6;
}

type Params = PolarParams | RhombicParams;

function polarControl(parent: Node): Observable<PolarParams> {
		return formGroup(parent, 'Polar', (parent: Node) => {
				const count = slider(parent, 'count', 'Side Count', 3, 12, 1, 3);
				const prism = slider(parent, 'prismHeight', 'Prism Height', 0.5, 1, 0.01, 0.62);

				return Observable.combineLatest(count, prism).map(([count, prismHeight]) => ({ type: 'polar', count, prismHeight }));
		});
}

function rhombicControl(parent: Node): Observable<RhombicParams> {
		const options: Option[] = [
				{ id: '4', title: 'Dodecahedron' },
				{ id: '6', title: 'Triacontahedron' },
		];

		return optionPicker(parent, 'count', 'Side Count', options, '4').map((count: string) => {
				if (count === '6') 
						return { type: 'rhombic', count: 6 };

				return { type: 'rhombic', count: 4 };
		});
}

function ZonohedronControl(parent: Node): Observable<Params> {
		const options: Option[] = [
				{ id: 'polar', title: 'Polar' },
				{ id: 'rhombic', title: 'Rhombic' },
		];
		
		const zType = optionPicker(parent, 'type', 'Type', options, 'polar');

		return zType.distinctUntilChanged().switchMap((zType: string) => {
				if (zType === 'rhombic') {
						return rhombicControl(parent);
				}

				return polarControl(parent);
		});
}

function oddPolar(n: number, prismHeight: number): three.Vector3[] {
		const top = [] as three.Vector3[];
		for (let i = 0; i < n; ++i) {
				const angle = 2 * Math.PI * i / n;
				const point = new three.Vector3(Math.cos(angle), Math.sin(angle), prismHeight);
				top.push(point);
		}
		return top;
}

function evenPolar(n: number, prismHeight: number): three.Vector3[] {
		const top = [] as three.Vector3[];
		for (let i = 0; i < n; ++i) {
				const angle = 2 * Math.PI * i / n;
				const point = new three.Vector3(Math.cos(angle), Math.sin(angle), prismHeight);
				top.push(point);
		}
		return top;
}

function polarZonohedron(n: number, prismHeight: number): three.Vector3[] {
		if (n & 1) {
				return oddPolar(n, prismHeight);
		}

		return evenPolar(n, prismHeight);
}

class Controls {
		controlState: Observable<ControlState>;

		constructor(parent: Node) {
				this.controlState = coldToHot(ZonohedronControl(parent)).map((params: Params) => this.computePoints(params));
		}

		computePoints(params: Params) {
				if (params.type === 'polar') {
						return { points: polarZonohedron(params.count, params.prismHeight) }
				}

				const root2over2 = 1.0/Math.sqrt(2);
				const p1 = [
						new three.Vector3(1, root2over2, 0),
						new three.Vector3(1, -root2over2, 0),
						new three.Vector3(0,  root2over2, 1),
						new three.Vector3(0, -root2over2, 1),
				]

				const phi = (1 + Math.sqrt(5)) / 2;
				const p2 = [
						new three.Vector3(0, 1, phi),
						new three.Vector3(0, 1, -phi),
						new three.Vector3(1, phi, 0),
						new three.Vector3(1, -phi, 0),
						new three.Vector3(phi, 0, 1),
						new three.Vector3(-phi, 0, 1),
				]

				const points = params.count === 6 ? p2 : p1;

				return { points };
		}
}

export class Zonohedron {
		mesh: three.Object3D;
		geometry: three.Geometry;
		controls: Observable<ControlState>;
		subscriptions: Subscription[];

		constructor(controls: Controls) {
				this.subscriptions = [];
				this.controls = controls.controlState;
				this.computeMesh();
		}


		setFaceColor(start: number): void {
				const color = new three.Color().setHSL(Math.random(), 0.3, 0.5);
				this.geometry.faces[start+0].color = color;
				this.geometry.faces[start+1].color = color;
		}

		addFaces(indices: [number, number, number, number]): void {
				const [i1, i2, i3, i4] = indices;

				const start = this.geometry.faces.length;

				this.geometry.faces.push(new three.Face3(i1, i2, i3));
				this.geometry.faces.push(new three.Face3(i1, i3, i4));

				this.setFaceColor(start);
		}

		computeMesh() {
				this.geometry = new three.Geometry();

				let numPoints: number;
				const subscription = this.controls.subscribe(({ points }) => {
						let bitG = bitGenerator(points.length);

						this.geometry.vertices = [];
						for (let bits of bitG) {
								let zero = new three.Vector3(0, 0, 0);
								this.geometry.vertices.push(
										bits.reduce((total: three.Vector3, bit: 0 | 1, index: number) => {
												if (bit === 1) {
														total.add(points[index])
												}
												return total;
										}, zero)
								);
						}

						const center = this.geometry.vertices[this.geometry.vertices.length - 1].clone().multiplyScalar(0.5);
						this.geometry.vertices.forEach(v => v.sub(center));

						if (numPoints !== points.length) {
								this.geometry.faces = [];
								numPoints = points.length;
								for (let i = 0; i < points.length - 1; i++) {
										for (let j = i+1; j < points.length; j++) {
												let indices = [] as number[];
												for (let k = 0; k < points.length; k++) {
														if (k !== i && k !== j) {
																indices.push((1<<k));
														}
												}
												let innerBitG = bitGenerator(indices.length);
												let vertices = [0, (1<<i), (1<<i) + (1<<j), (1<<j)];
												for (let innerBits of innerBitG) {
														let offset = innerBits.reduce((total, bit, index) => bit === 1 ? total + indices[index] : total, 0);
														this.addFaces(vertices.map(v => v+offset) as [number, number, number, number]);
												}
										}
								}
						}


						this.geometry.computeBoundingSphere();
						this.geometry.computeFaceNormals();
						this.geometry.elementsNeedUpdate = true;
				});

				this.subscriptions.push(subscription);

				const material = new three.MeshPhongMaterial({
						vertexColors: true,
						side: three.DoubleSide,
						// transparent: true,
						opacity: 0.6,
				});

				this.mesh = new three.Mesh( this.geometry, material );
		}

		cleanup() {
				this.subscriptions.forEach((subscription: Subscription) => {
						subscription.unsubscribe();
				});
				this.subscriptions = [];
		}
}


export default function zonohedron(scene: three.Scene): Observable<three.Object3D> {
		return new Observable((subscriber: Subscriber<three.Object3D>) => {
				const controlNode = document.getElementById('controls');
				if (!controlNode) {
						throw new Error("can't find controls");
				}

				const controls = new Controls(controlNode);
				const zonohedron = new Zonohedron(controls);
				scene.add(zonohedron.mesh);
				subscriber.next(zonohedron.mesh);
				return function() {
						scene.remove(zonohedron.mesh);
						zonohedron.cleanup();
				}
		})
}
