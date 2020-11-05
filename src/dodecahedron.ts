import * as Rx from 'rxjs-compat';
import * as three from 'three';
import * as Immutable from 'immutable';
import QuaternionSpline from './quaternionSpline';
import { Input } from './input';
import { Clock } from './clock';

type DodecahedronParams = {
		spline?: QuaternionSpline;
		time?: number;
}

type NormalDist = {
		mu: number;
		sigma: number;
}

type ColorState = {
		saturation: NormalDist;
		luminosity: NormalDist;
}

type ControlState = {
		stellationSize: number;
}

function initColors(): Rx.Observable<ColorState> {
		const sa = document.querySelector<HTMLInputElement>('#saturationAverage');
		const ss = document.querySelector<HTMLInputElement>('#saturationStdDev');
		const la = document.querySelector<HTMLInputElement>('#luminosityAverage');
		const ls = document.querySelector<HTMLInputElement>('#luminosityStdDev');
		if (sa && ss && la && ls) {
				const smu = Rx.Observable
						.fromEvent(sa, 'change')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(sa.value));
				const ssigma = Rx.Observable
						.fromEvent(ss, 'change')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(ss.value));
				const lmu = Rx.Observable
						.fromEvent(la, 'change')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(la.value));
				const lsigma = Rx.Observable
						.fromEvent(ls, 'change')
						.map((event: Event) => parseFloat((event.target as HTMLInputElement).value))
						.startWith(parseFloat(ls.value));
				return Rx.Observable
						.combineLatest(smu, ssigma, lmu, lsigma)
						.map(([smu, ssigma, lmu, lsigma]) => ({
								saturation: { mu: smu, sigma: ssigma },
								luminosity: { mu: lmu, sigma: lsigma },
						}));
		}

		throw new Error("Can't find range sliders")
}

function initControls(): Rx.Observable<ControlState> {
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


export class Dodecahedron extends Immutable.Record({
		spline: new QuaternionSpline([]),
		time: 0,
}) {
		constructor(qControls: three.Quaternion[] = []) {
				const spline = new QuaternionSpline(qControls);
				super({ spline });
		}

		with(values: DodecahedronParams) {
				return this.merge(values) as this;
		}

		process({ delta }: Clock, { speed }: Input) {
				const { time, spline: { end } } = this;
				let newTime = time + delta * speed;
				while (newTime > end) {
						newTime -= end;
				}

				return this.with({ time: newTime });
		}

		static randNormal(mu: number, sigma: number) {
				let u = 0, v = 0;
				while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
				while(v === 0) v = Math.random();
				const val = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
				return sigma * val + mu;
		}

		static computeColor(saturation: NormalDist, luminosity: NormalDist): three.Color {
				const sat = Dodecahedron.randNormal(saturation.mu, saturation.sigma);
				const lum = Dodecahedron.randNormal(luminosity.mu, luminosity.sigma);
				const clamp = (val: number) => Math.max(Math.min(val, 1), 0);
				
				return new three.Color().setHSL(Math.random(), clamp(sat), clamp(lum));
		}

		static computeCenter(geometry: three.Geometry, indices: number[], controls: Rx.Observable<ControlState>): three.Vector3 {
				const vertices = geometry.vertices;
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
				
				controls.subscribe(({ stellationSize }) => {
						point.set(center.x + n.x * stellationSize,
											center.y + n.y * stellationSize,
											center.z + n.z * stellationSize);
						geometry.elementsNeedUpdate = true;
				});

				return point;
		}

		static setFaceColors(faces: three.Face3[], saturation: NormalDist, luminosity: NormalDist): void {
				for (let i = 0; i < faces.length; i += 5) {
						const color = Dodecahedron.computeColor(saturation, luminosity);
						faces[i+0].color = color;
						faces[i+1].color = color;
						faces[i+2].color = color;
						faces[i+3].color = color;
						faces[i+4].color = color;
				}
		}

		static setFaceColor(faces: three.Face3[], start: number, { saturation, luminosity }: ColorState): void {
				const color = Dodecahedron.computeColor(saturation, luminosity);
				faces[start+0].color = color;
				faces[start+1].color = color;
				faces[start+2].color = color;
				faces[start+3].color = color;
				faces[start+4].color = color;
		}

		static addFaces(geometry: three.Geometry,
										indices: [number, number, number, number, number],
										controls: Rx.Observable<ControlState>,
										colors: Rx.Observable<ColorState>,
									 ): void {
				const center = Dodecahedron.computeCenter(geometry, indices, controls);
				const newIndex = geometry.vertices.length;
				geometry.vertices.push(center);

				const [i1, i2, i3, i4, i5] = indices;

				const start = geometry.faces.length;

				geometry.faces.push(new three.Face3(newIndex, i1, i2));
				geometry.faces.push(new three.Face3(newIndex, i2, i3));
				geometry.faces.push(new three.Face3(newIndex, i3, i4));
				geometry.faces.push(new three.Face3(newIndex, i4, i5));
				geometry.faces.push(new three.Face3(newIndex, i5, i1));

				colors.subscribe((colorState: ColorState) => {
						Dodecahedron.setFaceColor(geometry.faces, start, colorState)
						geometry.elementsNeedUpdate = true;
				});
		}

		static object3D(): three.Object3D {
				const geometry = new three.Geometry();
				const phi = 0.5 * (1 + Math.sqrt(5));
				const invPhi = 1.0 / phi;

				geometry.vertices.push(
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

				const colors = initColors();
				const controls = initControls();

				this.addFaces(geometry, [ 0, 12,  2, 17, 16], controls, colors);
				this.addFaces(geometry, [ 0,  8,  4, 14, 12], controls, colors);
				this.addFaces(geometry, [ 4, 18, 19,  6, 14], controls, colors);
				this.addFaces(geometry, [ 2, 12, 14,  6, 10], controls, colors);

				this.addFaces(geometry, [ 2, 10, 11,  3, 17], controls, colors);
				this.addFaces(geometry, [ 0, 16,  1,  9,  8], controls, colors);
				this.addFaces(geometry, [ 4,  8,  9,  5, 18], controls, colors);
				this.addFaces(geometry, [ 6, 19,  7, 11, 10], controls, colors);

				this.addFaces(geometry, [ 1, 16, 17,  3, 13], controls, colors);
				this.addFaces(geometry, [ 1, 13, 15,  5,  9], controls, colors);
				this.addFaces(geometry, [ 5, 15,  7, 19, 18], controls, colors);
				this.addFaces(geometry, [ 3, 11,  7, 15, 13], controls, colors);

				controls.subscribe(() => {
						geometry.computeBoundingSphere();
						geometry.computeFaceNormals();
				});

				const material = new three.MeshPhongMaterial({
						vertexColors: true,
				});

				return new three.Mesh( geometry, material );
		}
}

