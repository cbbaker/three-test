import { Observable, Subscriber, Subscription } from 'rxjs-compat';
import * as three from 'three';
import randomColors, { ColorState } from './randomColors';
import randNormal from './randNormal';
import { NormalDist } from './normalDistControl';
import coldToHot from './coldToHot';
import slider from './slider';

type ControlState = {
		stellationSize: number;
}

function stellationControl(parent: Node): Observable<number> {
		return new Observable((subscriber: Subscriber<number>) => {
				const group = document.createElement('div');
				group.setAttribute('class', 'form-group');
				const header = document.createElement('h4');
				header.appendChild(document.createTextNode('Stellation'));
				group.appendChild(header);
				parent.appendChild(group);

				const subscription = slider(group, 'stellationSize', 'Size', -1, 4, 0.02, 1)
						.subscribe(subscriber);
				return function() {
						subscription.unsubscribe();
						parent.removeChild(group);
				}
		});
}

class Controls {
		parent: Node;
		colorState: Observable<ColorState>;
		controlState: Observable<ControlState>;

		constructor(parent: Node) {
				this.parent = parent;
				this.colorState = coldToHot(randomColors(parent));
				this.controlState = coldToHot(stellationControl(parent)).map(stellationSize => ({ stellationSize }));
		}
}

export class Dodecahedron
{
		mesh: three.Object3D;
		geometry: three.Geometry;
		controls: Observable<ControlState>;
		colors: Observable<ColorState>;
		subscriptions: Subscription[];

		constructor(controls: Controls) {
				this.subscriptions = [];
				this.controls = controls.controlState;
				this.colors = controls.colorState;
				this.computeMesh();
		}

		computeColor(saturation: NormalDist, luminosity: NormalDist): three.Color {
				const sat = randNormal(saturation.mu, saturation.sigma);
				const lum = randNormal(luminosity.mu, luminosity.sigma);
				const clamp = (val: number) => Math.max(Math.min(val, 1), 0);
				
				return new three.Color().setHSL(Math.random(), clamp(sat), clamp(lum));
		}

		computeCenter(indices: number[]): three.Vector3 {
				const vertices = this.geometry.vertices;
				const v0 = vertices[indices[0]];
				const v1 = vertices[indices[1]].clone();
				const v2 = vertices[indices[2]].clone();
				const d1 = v1.sub(v0);
				const d2 = v2.sub(v0);
				const n = d1.cross(d2); // not a unit normal!
				// compute center
				const center = indices
						.reduce((total, index) => (total.add(vertices[index])), new three.Vector3)
						.multiplyScalar(1/indices.length);

				const point = center.clone();
				
				const subscription = this.controls.subscribe(({ stellationSize }) => {
						point.set(center.x + n.x * stellationSize,
											center.y + n.y * stellationSize,
											center.z + n.z * stellationSize);
						this.geometry.elementsNeedUpdate = true;
				});

				this.subscriptions.push(subscription);

				return point;
		}

		setFaceColor(start: number, { saturation, luminosity }: ColorState): void {
				const color = this.computeColor(saturation, luminosity);
				this.geometry.faces[start+0].color = color;
				this.geometry.faces[start+1].color = color;
				this.geometry.faces[start+2].color = color;
				this.geometry.faces[start+3].color = color;
				this.geometry.faces[start+4].color = color;
		}

		addFaces(indices: [number, number, number, number, number]): void {
				const center = this.computeCenter(indices);
				const newIndex = this.geometry.vertices.length;
				this.geometry.vertices.push(center);

				const [i1, i2, i3, i4, i5] = indices;

				const start = this.geometry.faces.length;

				this.geometry.faces.push(new three.Face3(newIndex, i1, i2));
				this.geometry.faces.push(new three.Face3(newIndex, i2, i3));
				this.geometry.faces.push(new three.Face3(newIndex, i3, i4));
				this.geometry.faces.push(new three.Face3(newIndex, i4, i5));
				this.geometry.faces.push(new three.Face3(newIndex, i5, i1));

				const subscription = this.colors.subscribe((colorState: ColorState) => {
						this.setFaceColor(start, colorState)
						this.geometry.elementsNeedUpdate = true;
				});

				this.subscriptions.push(subscription);
		}

		computeMesh() {
				this.geometry = new three.Geometry();
				const phi = 0.5 * (1 + Math.sqrt(5));
				const invPhi = 1.0 / phi;

				this.geometry.vertices.push(
						new three.Vector3( 1,  1,  1),        //  0
						new three.Vector3( 1,  1, -1),        //  1
						new three.Vector3( 1, -1,  1),        //  2
						new three.Vector3( 1, -1, -1),        //  3

						new three.Vector3(-1,  1,  1),        //  4
						new three.Vector3(-1,  1, -1),        //  5
						new three.Vector3(-1, -1,  1),        //  6
						new three.Vector3(-1, -1, -1),        //  7

						new three.Vector3(0,  phi,  invPhi),  //  8
						new three.Vector3(0,  phi, -invPhi),  //  9
						new three.Vector3(0, -phi,  invPhi),  // 10
						new three.Vector3(0, -phi, -invPhi),  // 11

						new three.Vector3( invPhi, 0,  phi),  // 12
						new three.Vector3( invPhi, 0, -phi),  // 13
						new three.Vector3(-invPhi, 0,  phi),  // 14
						new three.Vector3(-invPhi, 0, -phi),  // 15

						new three.Vector3( phi,  invPhi, 0),  // 16
						new three.Vector3( phi, -invPhi, 0),  // 17
						new three.Vector3(-phi,  invPhi, 0),  // 18
						new three.Vector3(-phi, -invPhi, 0),  // 19
				);

				this.addFaces([ 0, 12,  2, 17, 16]);
				this.addFaces([ 0,  8,  4, 14, 12]);
				this.addFaces([ 4, 18, 19,  6, 14]);
				this.addFaces([ 2, 12, 14,  6, 10]);

				this.addFaces([ 2, 10, 11,  3, 17]);
				this.addFaces([ 0, 16,  1,  9,  8]);
				this.addFaces([ 4,  8,  9,  5, 18]);
				this.addFaces([ 6, 19,  7, 11, 10]);

				this.addFaces([ 1, 16, 17,  3, 13]);
				this.addFaces([ 1, 13, 15,  5,  9]);
				this.addFaces([ 5, 15,  7, 19, 18]);
				this.addFaces([ 3, 11,  7, 15, 13]);

				const subscription = this.controls.subscribe(() => {
						this.geometry.computeBoundingSphere();
						this.geometry.computeFaceNormals();
				});

				this.subscriptions.push(subscription);

				const material = new three.MeshPhongMaterial({
						vertexColors: true,
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

export default function dodecahedron(scene: three.Scene): Observable<three.Object3D> {
		return new Observable((subscriber: Subscriber<three.Object3D>) => {
				const controlNode = document.getElementById('controls');
				if (!controlNode) {
						throw new Error("can't find controls");
				}

				const controls = new Controls(controlNode);
				const dodecahedron = new Dodecahedron(controls);
				scene.add(dodecahedron.mesh);
				subscriber.next(dodecahedron.mesh);
				return function() {
						scene.remove(dodecahedron.mesh);
						dodecahedron.cleanup();
				}
		})
}
