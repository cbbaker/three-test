import { Observable, Subscriber, Subscription } from 'rxjs-compat';
import * as three from 'three';
// import formGroup from './formGroup';
// import slider from './slider';

type ControlState = {
		opacity: number;
		showShell: boolean;
		showSkeleton: boolean;
		cubeCount: number;
		evenTriangleCount: number;
		oddTriangleCount: number;
}

class Controls {
		parent: Node;
		controlState: Observable<ControlState>;

		constructor(parent: Node) {
				this.parent = parent;
				this.controlState = Observable.of({
						opacity: 0.5,
						showShell: true,
						showSkeleton: false,
						cubeCount: 5,
						evenTriangleCount: 0,
						oddTriangleCount: 0,
				});
		}
}

type Permutation = number[];

function permutationsEqual(p1: Permutation, p2: Permutation): boolean {
		if (p1.length !== p2.length) {
				return false;
		}

		for (let i = 0; i < p1.length; ++i) {
				if (p1[i] !== p2[i]) {
						return false;
				}
		}

		return true;
}

function isPermutationOf(p1: Permutation, p2: Permutation): boolean {
		if (p1.length !== p2.length) {
				return false;
		}

		return p1.every(i => p2.indexOf(i) >= 0);
}

function compose(p1: Permutation, ...ps: Permutation[]) {
		const compose2 = (p1: Permutation, p2: Permutation): Permutation => p1.map((i: number) => p2[i]);
		return ps.reduce((acc, p) => compose2(acc, p), p1);
}

const id = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const a1 = [8, 5, 16, 13, 14, 19, 2, 11, 4, 18, 17, 3, 0, 15, 12, 7, 9, 1, 6, 10] // (0 8 4 14 12)(16 9 18 6 2)(7 11 3 13 15)(19 10 17 1 5)
const b1 = [9, 18, 13, 7, 0, 14, 17, 10, 8, 4, 3, 11, 1, 19, 16, 6, 5, 15, 12, 2] //  (0 9 4)(12 1 18)(16 5 14)(7 10 3)(15 6 17)(19 2 13)

function computeOperations(p: Permutation, operations: Permutation[]): Permutation[] {
		if (operations.find((op: Permutation) => permutationsEqual(p, op))) {
				return operations;
		}

		operations.push(p);

		const leftOperations = computeOperations(compose(p, a1), operations);
		return computeOperations(compose(p, b1), leftOperations);
}

const operations = computeOperations(id, []);

function computeCubeOperations(operations: Permutation[]): Permutation[] {
		const found = [] as Permutation[];

		operations.forEach(op => {
				if (!found.find(p => isPermutationOf(op.slice(0, 8), p.slice(0, 8)))) {
						found.push(op);
				}
		});

		return found;
}

const cubeOperations = computeCubeOperations(operations);
console.log('cubeOperations', cubeOperations);


export class Dodecahedron
{
		mesh: three.Object3D;
		geometry: three.Geometry;
		controls: Observable<ControlState>;
		subscriptions: Subscription[];
		materials: Map<string, three.Material>;
		colors: string[];

		constructor(controls: Controls) {
				this.subscriptions = [];
				this.controls = controls.controlState;
				this.createMaterials();
				this.computeMesh();
		}

		addFaces(indices: number[], materialIndex: number): void {
				for (let i = 2; i < indices.length; ++i) {
						const face = new three.Face3(indices[0], indices[i-1], indices[i]);
						face.materialIndex = materialIndex;
						this.geometry.faces.push(face);
				}
		}

		createMaterials() {
				this.controls.subscribe(({ opacity }) => {
						this.materials = new Map<string, three.Material>();
						this.materials.set('white', new three.MeshPhongMaterial({
								color: 0xffffff,
								transparent: opacity < 1,
								opacity,
						}));
						this.materials.set('red', new three.MeshPhongMaterial({
								color: 0xff0000,
								transparent: opacity < 1,
								opacity,
						}));
						this.materials.set('green', new three.MeshPhongMaterial({
								color: 0x00ff00,
								transparent: opacity < 1,
								opacity,
						}));
						this.materials.set('blue', new three.MeshPhongMaterial({
								color: 0x0000ff,
								transparent: opacity < 1,
								opacity,
						}));
						this.materials.set('yellow', new three.MeshPhongMaterial({
								color: 0xffff00,
								transparent: opacity < 1,
								opacity,
						}));
						this.materials.set('magenta', new three.MeshPhongMaterial({
								color: 0xff00ff,
								transparent: false,
						}));

						this.colors = Array.from(this.materials.keys());
				});
		}
		
		getMaterial(color: string): number {
				return this.colors.indexOf(color);
		}

		addCubeFaces(indices: Permutation, materialIndex: number): void {
				this.addFaces([indices[0], indices[2], indices[3], indices[1]], materialIndex); //+x
				this.addFaces([indices[4], indices[5], indices[7], indices[6]], materialIndex); //-x

				this.addFaces([indices[0], indices[1], indices[5], indices[4]], materialIndex); //+y
				this.addFaces([indices[2], indices[6], indices[7], indices[3]], materialIndex); //-y

				this.addFaces([indices[0], indices[4], indices[6], indices[2]], materialIndex); //+z
				this.addFaces([indices[1], indices[3], indices[7], indices[5]], materialIndex); //-z
		}

		addEvenTriangleFaces(indices: Permutation, materialIndex: number): void {
				this.addFaces([indices[0], indices[3], indices[5]], materialIndex);
				this.addFaces([indices[0], indices[6], indices[3]], materialIndex);
				this.addFaces([indices[0], indices[5], indices[6]], materialIndex);
				this.addFaces([indices[3], indices[6], indices[5]], materialIndex);
		}

		addOddTriangleFaces(indices: Permutation, materialIndex: number): void {
				this.addFaces([indices[1], indices[4], indices[2]], materialIndex);
				this.addFaces([indices[1], indices[2], indices[7]], materialIndex);
				this.addFaces([indices[1], indices[7], indices[4]], materialIndex);
				this.addFaces([indices[2], indices[4], indices[7]], materialIndex);
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

				const subscription = this.controls.subscribe(({ showSkeleton, showShell, cubeCount, evenTriangleCount, oddTriangleCount }) => {
						if (showSkeleton) {
								//cube
								this.addCubeFaces([0, 1, 2, 3, 4, 5, 6, 7], this.getMaterial('red'));

								// rectangles
								this.addFaces([8,  9, 11, 10], this.getMaterial('blue'));
								this.addFaces([8, 10, 11,  9], this.getMaterial('blue'));

								this.addFaces([12, 13, 15, 14], this.getMaterial('green'));
								this.addFaces([12, 14, 15, 13], this.getMaterial('green'));

								this.addFaces([16, 17, 19, 18], this.getMaterial('yellow'));
								this.addFaces([16, 18, 19, 17], this.getMaterial('yellow'));
						}
								
						for (let i = 0; i < cubeCount; ++i) {
								this.addCubeFaces(cubeOperations[i], i + 1);
						}

						for (let i = 0; i < evenTriangleCount; ++i) {
								this.addEvenTriangleFaces(cubeOperations[i], i + 1);
						}

						for (let i = 0; i < oddTriangleCount; ++i) {
								this.addOddTriangleFaces(cubeOperations[i], i + 1);
						}

						if (showShell) {
								// dodecahedron
								this.addFaces([ 0, 12,  2, 17, 16], this.getMaterial('white'));
								this.addFaces([ 0,  8,  4, 14, 12], this.getMaterial('white'));
								this.addFaces([ 4, 18, 19,  6, 14], this.getMaterial('white'));
								this.addFaces([ 2, 12, 14,  6, 10], this.getMaterial('white'));

								this.addFaces([ 2, 10, 11,  3, 17], this.getMaterial('white'));
								this.addFaces([ 0, 16,  1,  9,  8], this.getMaterial('white'));
								this.addFaces([ 4,  8,  9,  5, 18], this.getMaterial('white'));
								this.addFaces([ 6, 19,  7, 11, 10], this.getMaterial('white'));

								this.addFaces([ 1, 16, 17,  3, 13], this.getMaterial('white'));
								this.addFaces([ 1, 13, 15,  5,  9], this.getMaterial('white'));
								this.addFaces([ 5, 15,  7, 19, 18], this.getMaterial('white'));
								this.addFaces([ 3, 11,  7, 15, 13], this.getMaterial('white'));
						}

						this.geometry.computeBoundingSphere();
						this.geometry.computeFaceNormals();

						this.mesh = new three.Mesh( this.geometry, this.colors.map(color => this.materials.get(color)) );
				});

				this.subscriptions.push(subscription);
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
