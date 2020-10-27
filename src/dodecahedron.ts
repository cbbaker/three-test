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
		static computeColor(): three.Color {
				const sat = Dodecahedron.randNormal(0.5, 0.2);
				const lum = Dodecahedron.randNormal(0.5, 0.2);
				const clamp = (val: number) => Math.max(Math.min(val, 1), 0);
				return new three.Color().setHSL(Math.random(), clamp(sat), clamp(lum));
		}

		static computeCenter(vertices: three.Vector3[], indices: number[]): three.Vector3 {
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
				
				return center.addScaledVector(n, 2);
		}

		static addFaces(geometry: three.Geometry, indices: [number, number, number, number, number]): void {
				const color = Dodecahedron.computeColor();

				const center = Dodecahedron.computeCenter(geometry.vertices, indices);
				const newIndex = geometry.vertices.length;
				geometry.vertices.push(center);

				const [i1, i2, i3, i4, i5] = indices;

				geometry.faces.push(new three.Face3(newIndex, i1, i2, undefined, color));
				geometry.faces.push(new three.Face3(newIndex, i2, i3, undefined, color));
				geometry.faces.push(new three.Face3(newIndex, i3, i4, undefined, color));
				geometry.faces.push(new three.Face3(newIndex, i4, i5, undefined, color));
				geometry.faces.push(new three.Face3(newIndex, i5, i1, undefined, color));
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

				this.addFaces(geometry, [ 0, 12,  2, 17, 16]);
				this.addFaces(geometry, [ 0,  8,  4, 14, 12]);
				this.addFaces(geometry, [ 4, 18, 19,  6, 14]);
				this.addFaces(geometry, [ 2, 12, 14,  6, 10]);

				this.addFaces(geometry, [ 2, 10, 11,  3, 17]);
				this.addFaces(geometry, [ 0, 16,  1,  9,  8]);
				this.addFaces(geometry, [ 4,  8,  9,  5, 18]);
				this.addFaces(geometry, [ 6, 19,  7, 11, 10]);

				this.addFaces(geometry, [ 1, 16, 17,  3, 13]);
				this.addFaces(geometry, [ 1, 13, 15,  5,  9]);
				this.addFaces(geometry, [ 5, 15,  7, 19, 18]);
				this.addFaces(geometry, [ 3, 11,  7, 15, 13]);

				geometry.computeBoundingSphere();

				const material = new three.MeshBasicMaterial({
						vertexColors: true,
				});

				return new three.Mesh( geometry, material );
		}
}

