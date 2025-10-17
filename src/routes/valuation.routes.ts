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

const router = Router();

// Get all valuations for a company
router.get('/:ticker', getValuations);

// Get latest valuation for a company
router.get('/:ticker/latest', getLatestValuation);

// Generate sensitivity analysis
router.post('/:ticker/sensitivity', getSensitivityAnalysis);

// Get specific valuation by ID
router.get('/:ticker/:id', getValuationById);

// Create new valuation
router.post('/:ticker', createValuation);

// Update valuation
router.put('/:ticker/:id', updateValuation);

// Delete valuation
router.delete('/:ticker/:id', deleteValuation);

export default router;