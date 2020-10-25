import * as three from 'three';
import Spline from './spline';

export default class QuaternionSpline {
		spline: Spline;

		constructor(qcontrols: three.Quaternion[]) {
				const vcontrols = qcontrols.map(q => this.log(q));

				this.spline = new Spline(vcontrols, ([lx, ly, lz], [rx, ry, rz]) => {
						const dx = rx - lx;
						const dy = ry - ly;
						const dz = rz - lz;

						return Math.sqrt(dx * dx + dy * dy + dz * dz);
				});
		}

		get end(): number {
				return this.spline.end;
		}

		log(q: three.Quaternion): number[] {
				const cosA = q.w;
				if (cosA > 0.99999 || cosA < -0.99999) {
						return [0, 0, 0];
				}

				const invSinA = 1.0 / Math.sqrt(1 - cosA * cosA);
				const scale = Math.acos(cosA) * invSinA;

				return [scale * q.x, scale * q.y, scale * q.z];
		}

		exp([x, y, z]: number[]): three.Quaternion {
				const length = Math.sqrt(x * x + y * y + z * z);
				if (length < 0.00001) {
						return new three.Quaternion();
				}

				const w = Math.cos(length);
				const scale = Math.sin(length) / length;

				return new three.Quaternion(x * scale, y * scale, z * scale, w);
		}

		evalAt(t: number): three.Quaternion {
				const v = this.spline.evalAt(t);
				return this.exp(v);
		}
}
