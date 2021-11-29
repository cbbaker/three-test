type bit = 0 | 1;

export default function* bitGenerator(len: number) {
		let bits = [];
		for (let i = len; i > 0; --i) {
				bits.push(0);
		}

		while(true) {
				yield [...bits];

				let i = 0;
				for ( ; i < len; ++i) {
						if (bits[i] === 1) {
								bits[i] = 0;
						} else {
								bits[i] = 1;
								break;
						}
				}

				if (i === len) {
						return
				}
		}
}
