import { Router } from 'express'
import {
  getSectorAnalysis,
  getPeerComparison,
  getAllSectors,
  getIndustryDetails,
} from '../controllers/sector.controller.ts'
import { validateParams } from '../middleware/validation.ts'
import z from 'zod'

const router = Router()

const tickerSchema = z.object({
  ticker: z.string(),
})

const industryNameSchema = z.object({
  industryName: z.string(),
})

// Get list of all industries (keeping route as /list for consistency)
router.get('/list', getAllSectors)

// Get details about a specific industry by name
router.get(
  '/industry/:industryName',
  validateParams(industryNameSchema),
  getIndustryDetails
)

// Get industry analysis for a specific company
router.get('/:ticker', validateParams(tickerSchema), getSectorAnalysis)

// Get detailed peer comparison
router.get('/:ticker/peers', validateParams(tickerSchema), getPeerComparison)

export default router
