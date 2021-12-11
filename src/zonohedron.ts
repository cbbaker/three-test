import * as Rx from 'rxjs-compat';
import * as three from 'three';
import bitGenerator from './bitGenerator';

type NormalDist = {
		mu: number;
		sigma: number;
}

type ColorState = {
		saturation: NormalDist;
		luminosity: NormalDist;
}

type ControlState = {
		points: three.Vector3[];
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

		return Rx.Observable.from([{ points }]);
}


export class Zonohedron {
		static randNormal(mu: number, sigma: number) {
				let u = 0, v = 0;
				while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
				while(v === 0) v = Math.random();
				const val = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
				return sigma * val + mu;
		}

		static computeColor(saturation: NormalDist, luminosity: NormalDist): three.Color {
				const sat = Zonohedron.randNormal(saturation.mu, saturation.sigma);
				const lum = Zonohedron.randNormal(luminosity.mu, luminosity.sigma);
				const clamp = (val: number) => Math.max(Math.min(val, 1), 0);
				
				return new three.Color().setHSL(Math.random(), clamp(sat), clamp(lum));
		}

		static setFaceColor(faces: three.Face3[], start: number, { saturation, luminosity }: ColorState): void {
				const color = Zonohedron.computeColor(saturation, luminosity);
				faces[start+0].color = color;
				faces[start+1].color = color;
		}

		static addFaces(geometry: three.Geometry,
										indices: [number, number, number, number],
										colors: Rx.Observable<ColorState>,
									 ): void {
				const [i1, i2, i3, i4] = indices;

				const start = geometry.faces.length;

				geometry.faces.push(new three.Face3(i1, i2, i3));
				geometry.faces.push(new three.Face3(i1, i3, i4));

				colors.subscribe((colorState: ColorState) => {
						Zonohedron.setFaceColor(geometry.faces, start, colorState)
						geometry.elementsNeedUpdate = true;
				});
		}

		static object3D(): three.Object3D {
				const geometry = new three.Geometry();

				const colors = initColors();
				const controls = initControls();

				controls.subscribe(({ points }) => {
						let bitG = bitGenerator(points.length);

						for (let bits of bitG) {
								let zero = new three.Vector3(0, 0, 0);
								geometry.vertices.push(
										bits.reduce((total: three.Vector3, bit: 0 | 1, index: number) => {
												if (bit === 1) {
														total.add(points[index])
												}
												return total;
										}, zero)
								);
						}

						const center = geometry.vertices[geometry.vertices.length - 1].clone().multiplyScalar(0.5);
						geometry.vertices.forEach(v => v.sub(center));

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
												let offset = innerBits.reduce((total, bit, index) => bit === 1 ? total + indices[index] : total, 0)
												this.addFaces(geometry, vertices.map(v => v+offset) as [number, number, number, number], colors);
										}
								}
						}


						geometry.computeBoundingSphere();
						geometry.computeFaceNormals();
				});

				const material = new three.MeshPhongMaterial({
						vertexColors: true,
						side: three.DoubleSide,
						// transparent: true,
						opacity: 0.9,
				});

				return new three.Mesh( geometry, material );
		}
}

