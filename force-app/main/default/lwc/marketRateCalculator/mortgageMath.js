// mortgageMath.js
export function calculateMonthlyPayment(principal, annualRatePercent, termMonths) {
    const monthlyRate = annualRatePercent / 100 / 12;

    if (monthlyRate === 0) {
        return principal / termMonths;
    }

    const factor = Math.pow(1 + monthlyRate, termMonths);
    return principal * (monthlyRate * factor) / (factor - 1);
}