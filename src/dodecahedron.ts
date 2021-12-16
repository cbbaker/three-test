import * as Rx from 'rxjs-compat';
import * as three from 'three';
import * as Immutable from 'immutable';
import QuaternionSpline from './quaternionSpline';
import randomColors, { ColorState } from './randomColors';
import { Clock } from './clock';
import randNormal from './randNormal';
import { NormalDist } from './normalDistControl';

type ControlState = {
		stellationSize: number;
}

export class Dodecahedron
{
		mesh: three.Object3D;
		geometry: three.Geometry;
		controls: Rx.Observable<ControlState>;
		colors: Rx.Observable<ColorState>;

		constructor() {
				this.controls = this.initControls();
				this.colors = randomColors();
				this.computeMesh();
		}

		initControls(): Rx.Observable<ControlState> {
				const st = document.querySelector<HTMLInputElement>('#stellationSize');
				if (st) {
						return Rx.Observable
								.fromEvent(st, 'input')
								.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
								.startWith(parseFloat(st.value))
								.map(stellationSize => ({ stellationSize }));
				}

				throw new Error("Can't find range sliders")
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
				
				this.controls.subscribe(({ stellationSize }) => {
						point.set(center.x + n.x * stellationSize,
											center.y + n.y * stellationSize,
											center.z + n.z * stellationSize);
						this.geometry.elementsNeedUpdate = true;
				});

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

				this.colors.subscribe((colorState: ColorState) => {
						this.setFaceColor(start, colorState)
						this.geometry.elementsNeedUpdate = true;
				});
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

				this.controls.subscribe(() => {
						this.geometry.computeBoundingSphere();
						this.geometry.computeFaceNormals();
				});

				const material = new three.MeshPhongMaterial({
						vertexColors: true,
				});

				this.mesh = new three.Mesh( this.geometry, material );
		}
}

