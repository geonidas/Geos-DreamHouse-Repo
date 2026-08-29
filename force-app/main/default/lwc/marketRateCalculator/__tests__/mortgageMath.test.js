import { calculateMonthlyPayment } from '../mortgageMath';

describe('calculateMonthlyPayment', () => {
    it('calculates a standard 30-year payment', () => {
        // $300,000 at 6.5% over 360 months
        const payment = calculateMonthlyPayment(300000, 6.5, 360);
        expect(payment).toBeCloseTo(1896.2, 1);
    });

    it('calculates a 15-year payment at the same rate', () => {
        const payment = calculateMonthlyPayment(300000, 6.5, 180);
        expect(payment).toBeCloseTo(2613.32, 1);
    });

    it('produces a higher payment for a shorter term', () => {
        const thirtyYear = calculateMonthlyPayment(400000, 6.0, 360);
        const fifteenYear = calculateMonthlyPayment(400000, 6.0, 180);
        expect(fifteenYear).toBeGreaterThan(thirtyYear);
    });

    it('produces a higher payment as the rate rises', () => {
        const lower = calculateMonthlyPayment(300000, 5.0, 360);
        const higher = calculateMonthlyPayment(300000, 7.0, 360);
        expect(higher).toBeGreaterThan(lower);
    });

    it('handles a zero interest rate without dividing by zero', () => {
        // (1 + 0)^n - 1 === 0, so the standard formula would be 0/0.
        // The guard branch should return a simple principal/term split.
        const payment = calculateMonthlyPayment(360000, 0, 360);
        expect(payment).toBe(1000);
        expect(Number.isFinite(payment)).toBe(true);
    });

    it('returns zero when the principal is zero', () => {
        // Down payment covering the full purchase price.
        expect(calculateMonthlyPayment(0, 6.5, 360)).toBe(0);
    });

    it('returns a negative payment for a negative principal', () => {
        // Documents current behaviour: the function does no input validation,
        // so a down payment exceeding the price yields a nonsense negative.
        // The component is responsible for preventing this state.
        const payment = calculateMonthlyPayment(-50000, 6.5, 360);
        expect(payment).toBeLessThan(0);
    });

    it('scales linearly with principal', () => {
        const single = calculateMonthlyPayment(100000, 6.5, 360);
        const double = calculateMonthlyPayment(200000, 6.5, 360);
        expect(double).toBeCloseTo(single * 2, 6);
    });
});