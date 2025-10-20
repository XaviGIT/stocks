# Valuation Methodology

## DCF (Discounted Cash Flow) Model

The valuation system implements a Pat Dorsey-style 10-year discounted cash flow model for calculating intrinsic stock values.

## Model Overview

The DCF model calculates the present value of a company's future free cash flows to determine its intrinsic value per share.

### Formula
```
Intrinsic Value = (Sum of Discounted FCFs) + (Discounted Terminal Value)
Intrinsic Value Per Share = Total Intrinsic Value / Shares Outstanding
```

## Step-by-Step Calculation

### Step 1: Free Cash Flow Projections
Input 10 years of projected free cash flows (FCF).

**FCF Calculation:**
```
FCF = Operating Cash Flow - Capital Expenditures
```

### Step 2: Discount Future Cash Flows
Discount each year's FCF to present value using the discount rate.

**Formula:**
```
PV(FCF_t) = FCF_t / (1 + R)^t
```

Where:
- `FCF_t` = Free cash flow in year t
- `R` = Discount rate (as decimal, e.g., 0.10 for 10%)
- `t` = Year (1-10)

### Step 3: Calculate Terminal Value
Calculate the perpetuity value at year 10 using the Gordon Growth Model.

**Formula:**
```
Terminal Value = FCF_10 × (1 + g) / (R - g)
```

Where:
- `FCF_10` = Free cash flow in year 10
- `g` = Perpetual growth rate (as decimal, e.g., 0.03 for 3%)
- `R` = Discount rate

### Step 4: Discount Terminal Value
Discount the terminal value back to present value.

**Formula:**
```
PV(Terminal Value) = Terminal Value / (1 + R)^10
```

### Step 5: Calculate Total Equity Value
Sum all discounted cash flows and the discounted terminal value.

**Formula:**
```
Total Equity Value = Sum of PV(FCF_1 to FCF_10) + PV(Terminal Value)
```

### Step 6: Calculate Per-Share Value
Divide total equity value by shares outstanding.

**Formula:**
```
Intrinsic Value Per Share = Total Equity Value / Shares Outstanding
```

## Implementation Details

### Input Parameters

#### Required Inputs
- **FCF Projections**: Array of 10 annual free cash flow projections
- **Discount Rate**: Required rate of return (typically 8-12%)
- **Perpetual Growth Rate**: Long-term growth rate (typically 2-4%)
- **Shares Outstanding**: Number of shares outstanding

#### Validation Rules
- Exactly 10 FCF projections required
- Discount rate must be greater than perpetual growth rate
- Shares outstanding must be positive
- All FCF values must be numbers (can be negative)

### Calculation Engine

The DCF calculation is implemented in `src/services/valuation.service.ts`:

```typescript
export function calculateDCFValuation(inputs: DCFInputs): DCFCalculation {
  // Step 2: Discount cash flows
  const discountedFcfs = discountCashFlows(
    inputs.fcfProjections,
    inputs.discountRate
  );
  
  // Step 3: Calculate perpetuity value
  const { perpetuityValue, discountedPerpetuityValue } = calculatePerpetuityValue(
    inputs.fcfProjections[9], // FCF_10
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
    totalDiscountedFcf: discountedFcfs.reduce((sum, fcf) => sum + fcf, 0),
    perpetuityValue,
    discountedPerpetuityValue,
    totalEquityValue,
    intrinsicValuePerShare
  };
}
```

## Sensitivity Analysis

### Purpose
Sensitivity analysis shows how the intrinsic value changes with different assumptions for discount rate and perpetual growth rate.

### Implementation
The system generates a matrix of intrinsic values for various combinations:

```typescript
export function generateSensitivityAnalysis(
  fcfProjections: number[],
  sharesOutstanding: number,
  discountRates: number[], // e.g., [8, 9, 10, 11, 12]
  growthRates: number[]    // e.g., [2, 2.5, 3, 3.5, 4]
): Record<string, Record<string, number>>
```

### Example Output
```json
{
  "8%": {
    "2%": 95.50,
    "2.5%": 98.25,
    "3%": 101.00,
    "3.5%": 103.75,
    "4%": 106.50
  },
  "9%": {
    "2%": 89.75,
    "2.5%": 92.25,
    "3%": 94.75,
    "3.5%": 97.25,
    "4%": 99.75
  }
  // ... more combinations
}
```

## Worked Example

### Input Data
- **Company**: Apple Inc. (AAPL)
- **FCF Projections**: [100B, 110B, 121B, 133B, 146B, 161B, 177B, 195B, 214B, 236B]
- **Discount Rate**: 10%
- **Perpetual Growth Rate**: 3%
- **Shares Outstanding**: 15.7B

### Step-by-Step Calculation

#### Step 1: Discount FCFs
```
Year 1: 100B / (1.10)^1 = 90.91B
Year 2: 110B / (1.10)^2 = 90.91B
Year 3: 121B / (1.10)^3 = 90.91B
...
Year 10: 236B / (1.10)^10 = 91.00B
```

#### Step 2: Calculate Terminal Value
```
Terminal Value = 236B × (1.03) / (0.10 - 0.03) = 3,474B
```

#### Step 3: Discount Terminal Value
```
PV(Terminal Value) = 3,474B / (1.10)^10 = 1,339B
```

#### Step 4: Calculate Total Equity Value
```
Total Equity Value = 909B + 1,339B = 2,248B
```

#### Step 5: Calculate Per-Share Value
```
Intrinsic Value Per Share = 2,248B / 15.7B = $143.18
```

## Best Practices

### Discount Rate Selection
- **Risk-free rate**: 10-year Treasury yield
- **Equity risk premium**: 4-6% for developed markets
- **Company-specific risk**: 0-3% based on business risk
- **Typical range**: 8-12%

### Perpetual Growth Rate
- **Conservative**: 2-3% (inflation + real growth)
- **Moderate**: 3-4% (slightly above inflation)
- **Aggressive**: 4-5% (high-growth companies)
- **Never exceed**: 5% (unsustainable long-term)

### FCF Projections
- **Historical analysis**: Use 5-10 years of historical FCF
- **Growth assumptions**: Be conservative and realistic
- **Cyclical companies**: Consider business cycles
- **Mature companies**: Lower growth rates
- **Growth companies**: Higher initial growth, tapering off

## Common Pitfalls

### 1. Overly Optimistic Projections
- Avoid unrealistic growth assumptions
- Consider competitive pressures
- Factor in market saturation

### 2. Inappropriate Discount Rates
- Don't use too low discount rates
- Consider company-specific risks
- Update rates based on market conditions

### 3. Terminal Value Issues
- Perpetual growth rate too high
- Terminal value dominates calculation (>50% of total value)
- Not considering industry maturity

### 4. Data Quality
- Ensure FCF calculations are correct
- Use consistent accounting standards
- Verify shares outstanding (basic vs diluted)

## Margin of Safety

### Calculation
```
Margin of Safety = (Intrinsic Value - Current Price) / Intrinsic Value × 100%
```

### Interpretation
- **Positive**: Stock trading below intrinsic value
- **Negative**: Stock trading above intrinsic value
- **Target**: 20-30% margin of safety for value investing

## Limitations

### Model Limitations
- **Sensitive to inputs**: Small changes in assumptions create large value changes
- **Assumes perpetual growth**: No company grows forever
- **Static model**: Doesn't account for changing business conditions
- **Single scenario**: Doesn't consider multiple outcomes

### Data Limitations
- **Historical data**: Past performance doesn't guarantee future results
- **Projection accuracy**: 10-year projections are inherently uncertain
- **Market conditions**: Model doesn't account for market sentiment
- **Black swan events**: Unpredictable events can invalidate assumptions

## Alternative Approaches

### Multi-Scenario Analysis
- **Base case**: Most likely scenario
- **Bull case**: Optimistic assumptions
- **Bear case**: Pessimistic assumptions
- **Weighted average**: Probability-weighted scenarios

### Monte Carlo Simulation
- **Random sampling**: Multiple iterations with varying inputs
- **Probability distributions**: Range of possible outcomes
- **Confidence intervals**: Statistical significance of results

### Relative Valuation
- **P/E ratios**: Compare to industry peers
- **PEG ratios**: Price-to-earnings growth
- **EV/EBITDA**: Enterprise value multiples
- **Price-to-sales**: Revenue multiples

## Integration with Other Analysis

### Financial Statement Analysis
- **Profitability ratios**: ROE, ROA, margins
- **Efficiency ratios**: Asset turnover, inventory turnover
- **Leverage ratios**: Debt-to-equity, interest coverage
- **Growth ratios**: Revenue growth, earnings growth

### Qualitative Factors
- **Management quality**: Track record, integrity
- **Competitive moat**: Sustainable advantages
- **Industry trends**: Growth prospects, disruption risks
- **Regulatory environment**: Government policies, compliance

### Market Analysis
- **Sector analysis**: Industry performance, trends
- **Peer comparison**: Relative valuation metrics
- **Market sentiment**: Investor psychology, momentum
- **Macro factors**: Interest rates, inflation, GDP growth
