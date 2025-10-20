import { Router } from 'express';
import {
    getValuations,
    getLatestValuation,
    getValuationById,
    createValuation,
    updateValuation,
    deleteValuation,
    getSensitivityAnalysis
} from '../controllers/valuation.controller.ts';
import { validateParams, validateBody } from '../middleware/validation.ts';
import z from 'zod';

const router = Router();

// Validation schemas
const tickerSchema = z.object({
  ticker: z.string().min(1).max(10).regex(/^[A-Z]+$/, 'Ticker must be uppercase letters only')
});

const valuationIdSchema = z.object({
  ticker: z.string().min(1).max(10).regex(/^[A-Z]+$/, 'Ticker must be uppercase letters only'),
  id: z.string().uuid('Invalid valuation ID format')
});

const createValuationSchema = z.object({
  scenarioName: z.string().min(1).max(100).optional().default('Base Case'),
  discountRate: z.number().min(0.01).max(50).positive('Discount rate must be positive'),
  perpetualGrowthRate: z.number().min(0).max(10).positive('Growth rate must be positive'),
  sharesOutstanding: z.number().int().positive('Shares outstanding must be a positive integer'),
  fcfYear1: z.number().int(),
  fcfYear2: z.number().int(),
  fcfYear3: z.number().int(),
  fcfYear4: z.number().int(),
  fcfYear5: z.number().int(),
  fcfYear6: z.number().int(),
  fcfYear7: z.number().int(),
  fcfYear8: z.number().int(),
  fcfYear9: z.number().int(),
  fcfYear10: z.number().int(),
  notes: z.string().max(1000).optional()
}).refine((data) => data.discountRate > data.perpetualGrowthRate, {
  message: 'Discount rate must be greater than perpetual growth rate',
  path: ['discountRate']
});

const updateValuationSchema = z.object({
  scenarioName: z.string().min(1).max(100).optional(),
  discountRate: z.number().min(0.01).max(50).positive('Discount rate must be positive').optional(),
  perpetualGrowthRate: z.number().min(0).max(10).positive('Growth rate must be positive').optional(),
  sharesOutstanding: z.number().int().positive('Shares outstanding must be a positive integer').optional(),
  fcfYear1: z.number().int().optional(),
  fcfYear2: z.number().int().optional(),
  fcfYear3: z.number().int().optional(),
  fcfYear4: z.number().int().optional(),
  fcfYear5: z.number().int().optional(),
  fcfYear6: z.number().int().optional(),
  fcfYear7: z.number().int().optional(),
  fcfYear8: z.number().int().optional(),
  fcfYear9: z.number().int().optional(),
  fcfYear10: z.number().int().optional(),
  notes: z.string().max(1000).optional()
});

const sensitivityAnalysisSchema = z.object({
  valuationId: z.string().uuid('Invalid valuation ID format')
});

// Get all valuations for a company
router.get('/:ticker', validateParams(tickerSchema), getValuations);

// Get latest valuation for a company
router.get('/:ticker/latest', validateParams(tickerSchema), getLatestValuation);

// Generate sensitivity analysis
router.post('/:ticker/sensitivity', validateParams(tickerSchema), validateBody(sensitivityAnalysisSchema), getSensitivityAnalysis);

// Get specific valuation by ID
router.get('/:ticker/:id', validateParams(valuationIdSchema), getValuationById);

// Create new valuation
router.post('/:ticker', validateParams(tickerSchema), validateBody(createValuationSchema), createValuation);

// Update valuation
router.put('/:ticker/:id', validateParams(valuationIdSchema), validateBody(updateValuationSchema), updateValuation);

// Delete valuation
router.delete('/:ticker/:id', validateParams(valuationIdSchema), deleteValuation);

export default router;