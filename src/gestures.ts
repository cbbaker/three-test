export type Move = {
		type: 'move';
		x: number;
		y: number;
}

export type Twirl = {
		type: 'twirl';
		angle: number;
		scale: number;
}

export type Gesture = Move | Twirl;

