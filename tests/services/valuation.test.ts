import { describe, it, expect } from 'vitest';
import {
  calculateDCFValuation,
  generateSensitivityAnalysis,
  projectFCFWithGrowth
} from '../../src/services/valuation.service';

describe('Valuation Service', () => {
  describe('calculateDCFValuation', () => {
    it('should calculate DCF valuation correctly with known inputs', () => {
      const inputs = {
        fcfProjections: [
          100000000000, // 100B
          110000000000, // 110B
          121000000000, // 121B
          133100000000, // 133.1B
          146410000000, // 146.41B
          161051000000, // 161.051B
          177156100000, // 177.1561B
          194871710000, // 194.87171B
          214358881000, // 214.358881B
          235794769100  // 235.7947691B
        ],
        discountRate: 10, // 10%
        perpetualGrowthRate: 3, // 3%
        sharesOutstanding: 15728700000 // 15.7287B shares
      };

      const result = calculateDCFValuation(inputs);

      // Verify the structure
      expect(result).toHaveProperty('discountedFcfs');
      expect(result).toHaveProperty('totalDiscountedFcf');
      expect(result).toHaveProperty('perpetuityValue');
      expect(result).toHaveProperty('discountedPerpetuityValue');
      expect(result).toHaveProperty('totalEquityValue');
      expect(result).toHaveProperty('intrinsicValuePerShare');

      // Verify array lengths
      expect(result.discountedFcfs).toHaveLength(10);

      // Verify calculations are reasonable
      expect(result.intrinsicValuePerShare).toBeGreaterThan(0);
      expect(result.totalEquityValue).toBeGreaterThan(0);
      expect(result.perpetuityValue).toBeGreaterThan(0);
      expect(result.discountedPerpetuityValue).toBeGreaterThan(0);

      // Verify discounting is working (earlier years should have higher present values)
      expect(result.discountedFcfs[0]).toBeGreaterThan(result.discountedFcfs[9]);
    });

    it('should throw error for invalid inputs', () => {
      // Test wrong number of FCF projections
      expect(() => {
        calculateDCFValuation({
          fcfProjections: [100, 200], // Only 2 years instead of 10
          discountRate: 10,
          perpetualGrowthRate: 3,
          sharesOutstanding: 1000
        });
      }).toThrow('Must provide exactly 10 years of FCF projections');

      // Test discount rate <= growth rate
      expect(() => {
        calculateDCFValuation({
          fcfProjections: new Array(10).fill(100000000000),
          discountRate: 5,
          perpetualGrowthRate: 6, // Higher than discount rate
          sharesOutstanding: 1000
        });
      }).toThrow('Discount rate must be greater than perpetual growth rate');

      // Test negative shares
      expect(() => {
        calculateDCFValuation({
          fcfProjections: new Array(10).fill(100000000000),
          discountRate: 10,
          perpetualGrowthRate: 3,
          sharesOutstanding: -1000
        });
      }).toThrow('Shares outstanding must be positive');
    });

    it('should handle zero FCF projections', () => {
      const inputs = {
        fcfProjections: new Array(10).fill(0),
        discountRate: 10,
        perpetualGrowthRate: 3,
        sharesOutstanding: 1000
      };

      const result = calculateDCFValuation(inputs);

      expect(result.intrinsicValuePerShare).toBe(0);
      expect(result.totalEquityValue).toBe(0);
    });

    it('should handle negative FCF projections', () => {
      const inputs = {
        fcfProjections: new Array(10).fill(-100000000000), // All negative
        discountRate: 10,
        perpetualGrowthRate: 3,
        sharesOutstanding: 1000
      };

      const result = calculateDCFValuation(inputs);

      expect(result.intrinsicValuePerShare).toBeLessThan(0);
    });
  });

  describe('generateSensitivityAnalysis', () => {
    it('should generate sensitivity analysis matrix', () => {
      const fcfProjections = new Array(10).fill(100000000000);
      const sharesOutstanding = 1000000000;
      const discountRates = [8, 9, 10, 11, 12];
      const growthRates = [2, 2.5, 3, 3.5, 4];

      const result = generateSensitivityAnalysis(
        fcfProjections,
        sharesOutstanding,
        discountRates,
        growthRates
      );

      // Verify structure
      expect(result).toHaveProperty('8%');
      expect(result).toHaveProperty('9%');
      expect(result).toHaveProperty('10%');
      expect(result).toHaveProperty('11%');
      expect(result).toHaveProperty('12%');

      // Verify each discount rate has all growth rates
      Object.values(result).forEach(discountRow => {
        expect(discountRow).toHaveProperty('2%');
        expect(discountRow).toHaveProperty('2.5%');
        expect(discountRow).toHaveProperty('3%');
        expect(discountRow).toHaveProperty('3.5%');
        expect(discountRow).toHaveProperty('4%');
      });

      // Verify values are reasonable
      Object.values(result).forEach(discountRow => {
        Object.values(discountRow).forEach(value => {
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThan(0);
        });
      });
    });

    it('should handle invalid combinations gracefully', () => {
      const fcfProjections = new Array(10).fill(100000000000);
      const sharesOutstanding = 1000000000;
      const discountRates = [5, 6, 7]; // Low discount rates
      const growthRates = [8, 9, 10]; // High growth rates (invalid combinations)

      const result = generateSensitivityAnalysis(
        fcfProjections,
        sharesOutstanding,
        discountRates,
        growthRates
      );

      // Should return 0 for invalid combinations
      expect(result['5%']['8%']).toBe(0);
      expect(result['6%']['9%']).toBe(0);
      expect(result['7%']['10%']).toBe(0);
    });
  });

  describe('projectFCFWithGrowth', () => {
    it('should project FCF with constant growth rate', () => {
      const baseFcf = 100000000000; // 100B
      const growthRate = 10; // 10%
      const years = 5;

      const result = projectFCFWithGrowth(baseFcf, growthRate, years);

      expect(result).toHaveLength(5);
      expect(result[0]).toBe(110000000000); // 100B * 1.10
      expect(result[1]).toBe(121000000000); // 110B * 1.10
      expect(result[2]).toBe(133100000000); // 121B * 1.10
      expect(result[3]).toBe(146410000000); // 133.1B * 1.10
      expect(result[4]).toBe(161051000000); // 146.41B * 1.10
    });

    it('should handle zero growth rate', () => {
      const baseFcf = 100000000000;
      const growthRate = 0;
      const years = 3;

      const result = projectFCFWithGrowth(baseFcf, growthRate, years);

      expect(result).toEqual([100000000000, 100000000000, 100000000000]);
    });

    it('should handle negative growth rate', () => {
      const baseFcf = 100000000000;
      const growthRate = -5; // -5%
      const years = 3;

      const result = projectFCFWithGrowth(baseFcf, growthRate, years);

      expect(result[0]).toBe(95000000000); // 100B * 0.95
      expect(result[1]).toBe(90250000000); // 95B * 0.95
      expect(result[2]).toBe(85737500000); // 90.25B * 0.95
    });

    it('should use default 10 years when years not specified', () => {
      const baseFcf = 100000000000;
      const growthRate = 5;

      const result = projectFCFWithGrowth(baseFcf, growthRate);

      expect(result).toHaveLength(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small numbers', () => {
      const inputs = {
        fcfProjections: new Array(10).fill(1), // Very small FCF
        discountRate: 0.1, // Very small discount rate
        perpetualGrowthRate: 0.01, // Very small growth rate
        sharesOutstanding: 1
      };

      const result = calculateDCFValuation(inputs);

      expect(result.intrinsicValuePerShare).toBeGreaterThan(0);
      expect(Number.isFinite(result.intrinsicValuePerShare)).toBe(true);
    });

    it('should handle very large numbers', () => {
      const inputs = {
        fcfProjections: new Array(10).fill(Number.MAX_SAFE_INTEGER),
        discountRate: 50, // High discount rate
        perpetualGrowthRate: 1, // Low growth rate
        sharesOutstanding: 1
      };

      const result = calculateDCFValuation(inputs);

      expect(result.intrinsicValuePerShare).toBeGreaterThan(0);
      expect(Number.isFinite(result.intrinsicValuePerShare)).toBe(true);
    });
  });
});
