export default function randNormal(mu: number, sigma: number) {
		let u = 0, v = 0;
		while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
		while(v === 0) v = Math.random();
		const val = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
		return sigma * val + mu;
}
