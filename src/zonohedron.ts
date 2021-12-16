import * as Rx from 'rxjs-compat';
import * as three from 'three';
import bitGenerator from './bitGenerator';
import randNormal from './randNormal';
import { NormalDist } from './normalDistControl';
import randomColors, { ColorState } from './randomColors';

export type ControlState = {
		points: three.Vector3[];
}

function oddPolar(n: number): three.Vector3[] {
		const top = [] as three.Vector3[];
		for (let i = 0; i < n; ++i) {
				const angle = 2 * Math.PI * i / n;
				const point = new three.Vector3(Math.cos(angle), Math.sin(angle), 1);
				top.push(point);
		}
		return top;
}

function evenPolar(n: number): three.Vector3[] {
		const top = [] as three.Vector3[];
		for (let i = 0; i < n; ++i) {
				const angle = 2 * Math.PI * i / n;
				const point = new three.Vector3(Math.cos(angle), Math.sin(angle), 1);
				top.push(point);
		}
		return top;
}

function polarZonohedron(n: number): three.Vector3[] {
		if (n & 1) {
				return oddPolar(n);
		}

		return evenPolar(n);
}

export function initControls(): Rx.Observable<ControlState> {
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

		const points = true ? p2 : p1;

		// const points = polarZonohedron(5);

		return Rx.Observable.from([{ points }]);
}


export class Zonohedron {
		mesh: three.Object3D;
		geometry: three.Geometry;
		colors: Rx.Observable<ColorState>;
		controls: Rx.Observable<ControlState>;

		constructor() {
				this.colors = randomColors();
				this.controls = initControls();
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
				this.geometry.faces[start+0].color = color;
				this.geometry.faces[start+1].color = color;
		}

		addFaces(indices: [number, number, number, number]): void {
				const [i1, i2, i3, i4] = indices;

				const start = this.geometry.faces.length;

				this.geometry.faces.push(new three.Face3(i1, i2, i3));
				this.geometry.faces.push(new three.Face3(i1, i3, i4));

				this.colors.subscribe((colorState: ColorState) => {
						this.setFaceColor(start, colorState);
						this.geometry.elementsNeedUpdate = true;
				});
		}

		computeMesh() {
				this.geometry = new three.Geometry();

				this.controls.subscribe(({ points }) => {
						let bitG = bitGenerator(points.length);

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


						this.geometry.computeBoundingSphere();
						this.geometry.computeFaceNormals();
				});

				const material = new three.MeshPhongMaterial({
						vertexColors: true,
						side: three.DoubleSide,
						// transparent: true,
						opacity: 0.9,
				});

				this.mesh = new three.Mesh( this.geometry, material );
		}
}

