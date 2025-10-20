import { Router } from 'express'
import {
  getSectorAnalysis,
  getPeerComparison,
  getAllSectors,
} from '../controllers/sector.controller.ts'
import { validateParams } from '../middleware/validation.ts'
import z from 'zod'

const router = Router()

const tickerSchema = z.object({
  ticker: z.string(),
})

// Get list of all sectors
router.get('/list', getAllSectors)

// Get sector analysis for a specific company
router.get('/:ticker', validateParams(tickerSchema), getSectorAnalysis)

// Get detailed peer comparison
router.get('/:ticker/peers', validateParams(tickerSchema), getPeerComparison)

export default router
