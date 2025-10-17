import { Router } from 'express'
import z from 'zod'

import {
  getCompany,
  getCompanyFinancials,
  searchCompany,
} from '../controllers/company.controller.ts'
import {
  validateParams,
  validateQueryParams,
} from '../middleware/validation.ts'

const router = Router()

const getCompanySchema = z.object({
  ticker: z.string(),
})

const searchQueryParamsSchema = z.object({
  term: z.string().min(2),
})

router.get('/', validateQueryParams(searchQueryParamsSchema), searchCompany)

router.get('/:ticker', validateParams(getCompanySchema), getCompany)

router.get(
  '/:ticker/financials',
  validateParams(getCompanySchema),
  getCompanyFinancials
)

export default router
