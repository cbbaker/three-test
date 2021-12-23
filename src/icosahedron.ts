import { Observable, Subscriber, Subscription } from 'rxjs-compat';
import * as three from 'three';
import randomColors, { ColorState } from './randomColors';
import randNormal from './randNormal';
import { NormalDist } from './normalDistControl';
import coldToHot from './coldToHot';
import formGroup from './formGroup';
import slider from './slider';

type ControlState = {
		interpolate: number;
}

function interpolateControl(parent: Node): Observable<number> {
		return formGroup(parent, 'Interpolate', (parent: Node) => slider(parent, 'interpolateSize', 'Size', 0.5, 1, 0.01, 0.62));
}

class Controls {
		parent: Node;
		colorState: Observable<ColorState>;
		controlState: Observable<ControlState>;

		constructor(parent: Node) {
				this.parent = parent;
				this.colorState = coldToHot(randomColors(parent));
				this.controlState = coldToHot(interpolateControl(parent)).map(interpolate => ({ interpolate }));
		}
}

export class Icosahedron
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

		setFaceColor(start: number, { saturation, luminosity }: ColorState): void {
				const color = this.computeColor(saturation, luminosity);
				this.geometry.faces[start].color = color;
		}

		addFace(indices: [number, number, number]): void {
				const [i1, i2, i3] = indices;

				const start = this.geometry.faces.length;

				this.geometry.faces.push(new three.Face3(i1, i2, i3));

				const subscription = this.colors.subscribe((colorState: ColorState) => {
						this.setFaceColor(start, colorState)
						this.geometry.elementsNeedUpdate = true;
				});

				this.subscriptions.push(subscription);
		}

		computeVertices(interpolate: number) {
				this.geometry.vertices = [];
				const scale = 3.0
				const a = interpolate * scale, b = (1 - interpolate) * scale;
				// x -> y
				this.geometry.vertices.push(new three.Vector3( b,  a, 0)); //  0
				this.geometry.vertices.push(new three.Vector3( b, -a, 0)); //  1 
				this.geometry.vertices.push(new three.Vector3(-b,  a, 0)); //  2
				this.geometry.vertices.push(new three.Vector3(-b, -a, 0)); //  3
				// y -> z
				this.geometry.vertices.push(new three.Vector3(0,  b,  a)); //  4
				this.geometry.vertices.push(new three.Vector3(0,  b, -a)); //  5
				this.geometry.vertices.push(new three.Vector3(0, -b,  a)); //  6
				this.geometry.vertices.push(new three.Vector3(0, -b, -a)); //  7
				// z -> x
				this.geometry.vertices.push(new three.Vector3( a, 0,  b)); //  8
				this.geometry.vertices.push(new three.Vector3(-a, 0,  b)); //  9
				this.geometry.vertices.push(new three.Vector3( a, 0, -b)); // 10
				this.geometry.vertices.push(new three.Vector3(-a, 0, -b)); // 11
		}

		computeMesh() {
				this.geometry = new three.Geometry();

				const phi = 0.5 * (1 + Math.sqrt(5));
				const invPhi = 1.0 / phi;

				this.computeVertices(invPhi);

				// equilaterals
				this.addFace([ 0,  4,  8]); // +x, +y, +z
				this.addFace([ 0, 10,  5]); // +x, +y, -z
				this.addFace([ 1,  8,  6]); // +x, -y, +z
				this.addFace([ 1,  7, 10]); // +x, -y, -z

				this.addFace([ 2,  9,  4]) // -x, +y, +z
				this.addFace([ 2,  5, 11]) // -x, +y, -z
				this.addFace([ 3,  6,  9]) // -x, -y, +z
				this.addFace([ 3, 11,  7]) // -x, -y, -z

				// isoceleses
				// z-plane
				this.addFace([ 0,  8, 10])
				this.addFace([ 1, 10,  8])
				this.addFace([ 2, 11,  9])
				this.addFace([ 3,  9, 11])
				// x-plane
				this.addFace([ 4,  0,  2])
				this.addFace([ 5,  2,  0])
				this.addFace([ 6,  3,  1])
				this.addFace([ 7,  1,  3])
				// y-plane
				this.addFace([ 8,  4,  6])
				this.addFace([ 9,  6,  4])
				this.addFace([10,  7,  5])
				this.addFace([11,  5,  7])

				const subscription = this.controls.subscribe(({ interpolate }) => {
						this.computeVertices(interpolate);
						this.geometry.computeBoundingSphere();
						this.geometry.computeFaceNormals();
						this.geometry.elementsNeedUpdate = true;
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


export default function icosahedron(scene: three.Scene): Observable<three.Object3D> {
		return new Observable((subscriber: Subscriber<three.Object3D>) => {
				const controlNode = document.getElementById('controls');
				if (!controlNode) {
						throw new Error("can't find controls");
				}

				const controls = new Controls(controlNode);
				const icosahedron = new Icosahedron(controls);
				scene.add(icosahedron.mesh);
				subscriber.next(icosahedron.mesh);
				return function() {
						scene.remove(icosahedron.mesh);
						icosahedron.cleanup();
				}
		})
}
