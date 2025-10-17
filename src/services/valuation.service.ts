/** Using Pat Dorsey simple valuation model */

interface DCFInputs {
    fcfProjections: number[]; // 10 years of FCF projections
    discountRate: number; // R (as percentage, e.g., 10 for 10%)
    perpetualGrowthRate: number; // g (as percentage, e.g., 3 for 3%)
    sharesOutstanding: number;
}

interface DCFCalculation {
    discountedFcfs: number[];
    totalDiscountedFcf: number;
    perpetuityValue: number;
    discountedPerpetuityValue: number;
    totalEquityValue: number;
    intrinsicValuePerShare: number;
}

/**
 * Step 1: Already have FCF projections from input
 * 
 * Step 2: Discount each FCF to present value
 * Formula: Discounted FCF = FCF / (1 + R)^N
 */
function discountCashFlows(fcfProjections: number[], discountRate: number): number[] {
    const r = discountRate / 100; // Convert percentage to decimal
    
    return fcfProjections.map((fcf, index) => {
        const year = index + 1; // Year 1-10
        const discountFactor = Math.pow(1 + r, year);
        return fcf / discountFactor;
    });
}

/**
 * Step 3: Calculate perpetuity value and discount it to present
 * Formula: Perpetuity Value = FCF₁₀ × (1 + g) ÷ (R - g)
 * Formula: Discounted Perpetuity Value = Perpetuity Value ÷ (1 + R)^10
 */
function calculatePerpetuityValue(
    fcf10: number,
    discountRate: number,
    perpetualGrowthRate: number
): { perpetuityValue: number; discountedPerpetuityValue: number } {
    const r = discountRate / 100;
    const g = perpetualGrowthRate / 100;
    
    // Perpetuity value at year 10
    const perpetuityValue = (fcf10 * (1 + g)) / (r - g);
    
    // Discount back to present (year 0)
    const discountFactor = Math.pow(1 + r, 10);
    const discountedPerpetuityValue = perpetuityValue / discountFactor;
    
    return { perpetuityValue, discountedPerpetuityValue };
}

/**
 * Step 4: Calculate total equity value
 * Total Equity Value = Sum of Discounted FCFs + Discounted Perpetuity Value
 */
function calculateTotalEquityValue(
    discountedFcfs: number[],
    discountedPerpetuityValue: number
): number {
    const sumDiscountedFcfs = discountedFcfs.reduce((sum, fcf) => sum + fcf, 0);
    return sumDiscountedFcfs + discountedPerpetuityValue;
}

/**
 * Step 5: Calculate per share value
 * Per Share Value = Total Equity Value ÷ Shares Outstanding
 */
function calculatePerShareValue(
    totalEquityValue: number,
    sharesOutstanding: number
): number {
    return totalEquityValue / sharesOutstanding;
}

/**
 * Complete DCF Valuation Model
 * Implements Pat Dorsey's 10-year valuation model step by step
 */
export function calculateDCFValuation(inputs: DCFInputs): DCFCalculation {
    // Validate inputs
    if (inputs.fcfProjections.length !== 10) {
        throw new Error('Must provide exactly 10 years of FCF projections');
    }
    
    if (inputs.discountRate <= inputs.perpetualGrowthRate) {
        throw new Error('Discount rate must be greater than perpetual growth rate');
    }
    
    if (inputs.sharesOutstanding <= 0) {
        throw new Error('Shares outstanding must be positive');
    }
    
    // Step 2: Discount cash flows
    const discountedFcfs = discountCashFlows(
        inputs.fcfProjections,
        inputs.discountRate
    );
    
    const totalDiscountedFcf = discountedFcfs.reduce((sum, fcf) => sum + fcf, 0);
    
    // Step 3: Calculate perpetuity value
    const fcf10 = inputs.fcfProjections[9]; // Last year FCF
    const { perpetuityValue, discountedPerpetuityValue } = calculatePerpetuityValue(
        fcf10,
        inputs.discountRate,
        inputs.perpetualGrowthRate
    );
    
    // Step 4: Calculate total equity value
    const totalEquityValue = calculateTotalEquityValue(
        discountedFcfs,
        discountedPerpetuityValue
    );
    
    // Step 5: Calculate per share value
    const intrinsicValuePerShare = calculatePerShareValue(
        totalEquityValue,
        inputs.sharesOutstanding
    );
    
    return {
        discountedFcfs,
        totalDiscountedFcf,
        perpetuityValue,
        discountedPerpetuityValue,
        totalEquityValue,
        intrinsicValuePerShare
    };
}

/**
 * Generate sensitivity analysis for different discount and growth rates
 */
export function generateSensitivityAnalysis(
    fcfProjections: number[],
    sharesOutstanding: number,
    discountRates: number[], // e.g., [8, 9, 10, 11, 12]
    growthRates: number[] // e.g., [2, 2.5, 3, 3.5, 4]
): Record<string, Record<string, number>> {
    const results: Record<string, Record<string, number>> = {};
    
    for (const discountRate of discountRates) {
        results[`${discountRate}%`] = {};
        
        for (const growthRate of growthRates) {
            try {
                const calc = calculateDCFValuation({
                    fcfProjections,
                    discountRate,
                    perpetualGrowthRate: growthRate,
                    sharesOutstanding
                });
                
                results[`${discountRate}%`][`${growthRate}%`] = 
                    Math.round(calc.intrinsicValuePerShare * 100) / 100;
            } catch (e) {
                results[`${discountRate}%`][`${growthRate}%`] = 0;
            }
        }
    }
    
    return results;
}

/**
 * Helper function to project FCF based on growth rate
 * Useful for quick scenario generation
 */
export function projectFCFWithGrowth(
    baseFcf: number,
    growthRate: number,
    years: number = 10
): number[] {
    const projections: number[] = [];
    let currentFcf = baseFcf;
    
    for (let i = 0; i < years; i++) {
        currentFcf = currentFcf * (1 + growthRate / 100);
        projections.push(Math.round(currentFcf));
    }
    
    return projections;
}