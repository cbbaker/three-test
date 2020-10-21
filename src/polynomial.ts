export default class Polynomial {
		coefficients: number[];
		knot: number;


    constructor(coefficients: number[], knot: number) {
        this.coefficients = coefficients;
        this.knot = knot;
    }

    evalAt(t: number): number {
        if (this.coefficients.length === 0) {
            return 0;
        }
        var i = this.coefficients.length - 1;
        var result = this.coefficients[i];
        while (--i >= 0) {
            result = result * t + this.coefficients[i];
        }

        return result;
    }

    derivative(): Polynomial {
        var coefficients = [];
        for (var i = 1; i < this.coefficients.length; ++i) {
            coefficients.push(this.coefficients[i] * i);
        }

        return new Polynomial(coefficients, this.knot);
    }

    toString(): string {
        var result = [] as string[];
        const length = this.coefficients.length;
        switch (length) {
        case 0:
            result.push("0");
            break;
        case 1:
            if (this.coefficients[0] !== 0) {
                result = [this.coefficients[0].toString()];
            }
            break;
        default:
            if (this.coefficients[0] !== 0) {
                result.push(this.coefficients[0].toString());
            }
            if (this.coefficients[1] !== 0) {
                result.push(this.coefficients[1] + " t");
            }
            for (var i = 2; i < length; ++i) {
                if (this.coefficients[i] !== 0) {
                    result.push(this.coefficients[i] + " t^" + i);
                }
            }
            break;
        }
        return result.join(' + ');
    }

    toControlPoints(): number[] {
        const c0 = this.coefficients[0];
        const c1 = this.coefficients[1] * this.knot;
        const c2 = this.coefficients[2] * this.knot * this.knot;
        const c3 = this.coefficients[3] * this.knot * this.knot * this.knot;
        return [c0,
                c0 + c1 / 3,
                c0 + 2 * c1 / 3 + c2 / 3,
                c0 + c1 + c2 + c3];
    }
};
