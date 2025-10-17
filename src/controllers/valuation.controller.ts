// src/controllers/valuation.controller.ts
import type { Request, Response } from 'express'
import { eq, and, desc } from 'drizzle-orm'
import db from '../db/connection.ts'
import {
  companies,
  valuations,
  type Valuation,
  type NewValuation,
  cashFlowStatements,
} from '../db/schema.ts'
import {
  calculateDCFValuation,
  generateSensitivityAnalysis,
} from '../services/valuation.service.ts'

/**
 * GET /api/valuations/:ticker
 * Get all valuations for a company
 */
export const getValuations = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    // Find company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    // Get all valuations for this company
    const allValuations = await db
      .select()
      .from(valuations)
      .where(eq(valuations.companyId, company.id))
      .orderBy(desc(valuations.createdAt))

    res.json({
      ticker,
      companyName: company.name,
      valuations: allValuations,
    })
  } catch (error) {
    console.error('Error fetching valuations:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch valuations',
    })
  }
}

/**
 * GET /api/valuations/:ticker/latest
 * Get the most recent valuation for a company
 */
export const getLatestValuation = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    const [latestValuation] = await db
      .select()
      .from(valuations)
      .where(eq(valuations.companyId, company.id))
      .orderBy(desc(valuations.createdAt))
      .limit(1)

    if (!latestValuation) {
      return res.status(404).json({
        error: 'No valuations found',
        message: `No valuations exist for ${ticker}`,
      })
    }

    res.json({
      ticker,
      companyName: company.name,
      valuation: latestValuation,
    })
  } catch (error) {
    console.error('Error fetching latest valuation:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch latest valuation',
    })
  }
}

/**
 * GET /api/valuations/:ticker/:id
 * Get a specific valuation by ID
 */
export const getValuationById = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()
    const valuationId = req.params.id

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    const [valuation] = await db
      .select()
      .from(valuations)
      .where(
        and(
          eq(valuations.id, valuationId),
          eq(valuations.companyId, company.id)
        )
      )
      .limit(1)

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found',
        message: `No valuation found with ID ${valuationId}`,
      })
    }

    res.json({
      ticker,
      companyName: company.name,
      valuation,
    })
  } catch (error) {
    console.error('Error fetching valuation:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch valuation',
    })
  }
}

/**
 * POST /api/valuations/:ticker
 * Create a new valuation
 */
export const createValuation = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    const {
      scenarioName = 'Base Case',
      discountRate,
      perpetualGrowthRate,
      sharesOutstanding,
      fcfYear1,
      fcfYear2,
      fcfYear3,
      fcfYear4,
      fcfYear5,
      fcfYear6,
      fcfYear7,
      fcfYear8,
      fcfYear9,
      fcfYear10,
      notes,
    } = req.body

    // Validate required fields
    if (!discountRate || !perpetualGrowthRate || !sharesOutstanding) {
      return res.status(400).json({
        error: 'Missing required fields',
        message:
          'discountRate, perpetualGrowthRate, and sharesOutstanding are required',
      })
    }

    // Validate FCF projections
    const fcfProjections = [
      fcfYear1,
      fcfYear2,
      fcfYear3,
      fcfYear4,
      fcfYear5,
      fcfYear6,
      fcfYear7,
      fcfYear8,
      fcfYear9,
      fcfYear10,
    ]

    if (fcfProjections.some((fcf) => fcf === undefined || fcf === null)) {
      return res.status(400).json({
        error: 'Missing FCF projections',
        message: 'All 10 years of FCF projections are required',
      })
    }

    // Calculate DCF valuation
    const calculation = calculateDCFValuation({
      fcfProjections,
      discountRate: parseFloat(discountRate),
      perpetualGrowthRate: parseFloat(perpetualGrowthRate),
      sharesOutstanding: parseInt(sharesOutstanding),
    })

    // Create valuation record
    const [newValuation] = await db
      .insert(valuations)
      .values({
        companyId: company.id,
        scenarioName,
        discountRate,
        perpetualGrowthRate,
        sharesOutstanding,
        fcfYear1,
        fcfYear2,
        fcfYear3,
        fcfYear4,
        fcfYear5,
        fcfYear6,
        fcfYear7,
        fcfYear8,
        fcfYear9,
        fcfYear10,
        totalDiscountedFcf: Math.round(calculation.totalDiscountedFcf),
        perpetuityValue: Math.round(calculation.perpetuityValue),
        discountedPerpetuityValue: Math.round(
          calculation.discountedPerpetuityValue
        ),
        totalEquityValue: Math.round(calculation.totalEquityValue),
        intrinsicValuePerShare: calculation.intrinsicValuePerShare.toFixed(2),
        notes,
      })
      .returning()

    res.status(201).json({
      ticker,
      companyName: company.name,
      valuation: newValuation,
      calculation: {
        discountedFcfs: calculation.discountedFcfs,
        marginOfSafety: company.price
          ? (
              ((calculation.intrinsicValuePerShare -
                parseFloat(company.price)) /
                calculation.intrinsicValuePerShare) *
              100
            ).toFixed(2) + '%'
          : null,
      },
    })
  } catch (error) {
    console.error('Error creating valuation:', error)
    res.status(500).json({
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Failed to create valuation',
    })
  }
}

/**
 * PUT /api/valuations/:ticker/:id
 * Update an existing valuation
 */
export const updateValuation = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()
    const valuationId = req.params.id

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    const [existingValuation] = await db
      .select()
      .from(valuations)
      .where(
        and(
          eq(valuations.id, valuationId),
          eq(valuations.companyId, company.id)
        )
      )
      .limit(1)

    if (!existingValuation) {
      return res.status(404).json({
        error: 'Valuation not found',
        message: `No valuation found with ID ${valuationId}`,
      })
    }

    const {
      scenarioName,
      discountRate,
      perpetualGrowthRate,
      sharesOutstanding,
      fcfYear1,
      fcfYear2,
      fcfYear3,
      fcfYear4,
      fcfYear5,
      fcfYear6,
      fcfYear7,
      fcfYear8,
      fcfYear9,
      fcfYear10,
      notes,
    } = req.body

    // Prepare update data
    const updateData: Partial<NewValuation> = {
      updatedAt: new Date(),
    }

    if (scenarioName !== undefined) updateData.scenarioName = scenarioName
    if (discountRate !== undefined) updateData.discountRate = discountRate
    if (perpetualGrowthRate !== undefined)
      updateData.perpetualGrowthRate = perpetualGrowthRate
    if (sharesOutstanding !== undefined)
      updateData.sharesOutstanding = sharesOutstanding
    if (fcfYear1 !== undefined) updateData.fcfYear1 = fcfYear1
    if (fcfYear2 !== undefined) updateData.fcfYear2 = fcfYear2
    if (fcfYear3 !== undefined) updateData.fcfYear3 = fcfYear3
    if (fcfYear4 !== undefined) updateData.fcfYear4 = fcfYear4
    if (fcfYear5 !== undefined) updateData.fcfYear5 = fcfYear5
    if (fcfYear6 !== undefined) updateData.fcfYear6 = fcfYear6
    if (fcfYear7 !== undefined) updateData.fcfYear7 = fcfYear7
    if (fcfYear8 !== undefined) updateData.fcfYear8 = fcfYear8
    if (fcfYear9 !== undefined) updateData.fcfYear9 = fcfYear9
    if (fcfYear10 !== undefined) updateData.fcfYear10 = fcfYear10
    if (notes !== undefined) updateData.notes = notes

    // Recalculate if any FCF or rate values changed
    const fcfProjections = [
      fcfYear1 ?? existingValuation.fcfYear1,
      fcfYear2 ?? existingValuation.fcfYear2,
      fcfYear3 ?? existingValuation.fcfYear3,
      fcfYear4 ?? existingValuation.fcfYear4,
      fcfYear5 ?? existingValuation.fcfYear5,
      fcfYear6 ?? existingValuation.fcfYear6,
      fcfYear7 ?? existingValuation.fcfYear7,
      fcfYear8 ?? existingValuation.fcfYear8,
      fcfYear9 ?? existingValuation.fcfYear9,
      fcfYear10 ?? existingValuation.fcfYear10,
    ]

    const calculation = calculateDCFValuation({
      fcfProjections,
      discountRate: parseFloat(discountRate ?? existingValuation.discountRate),
      perpetualGrowthRate: parseFloat(
        perpetualGrowthRate ?? existingValuation.perpetualGrowthRate
      ),
      sharesOutstanding: parseInt(
        sharesOutstanding ?? existingValuation.sharesOutstanding
      ),
    })

    updateData.totalDiscountedFcf = Math.round(calculation.totalDiscountedFcf)
    updateData.perpetuityValue = Math.round(calculation.perpetuityValue)
    updateData.discountedPerpetuityValue = Math.round(
      calculation.discountedPerpetuityValue
    )
    updateData.totalEquityValue = Math.round(calculation.totalEquityValue)
    updateData.intrinsicValuePerShare =
      calculation.intrinsicValuePerShare.toFixed(2)

    // Update the valuation
    const [updatedValuation] = await db
      .update(valuations)
      .set(updateData)
      .where(eq(valuations.id, valuationId))
      .returning()

    res.json({
      ticker,
      companyName: company.name,
      valuation: updatedValuation,
    })
  } catch (error) {
    console.error('Error updating valuation:', error)
    res.status(500).json({
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Failed to update valuation',
    })
  }
}

/**
 * DELETE /api/valuations/:ticker/:id
 * Delete a valuation
 */
export const deleteValuation = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()
    const valuationId = req.params.id

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    const [deleted] = await db
      .delete(valuations)
      .where(
        and(
          eq(valuations.id, valuationId),
          eq(valuations.companyId, company.id)
        )
      )
      .returning()

    if (!deleted) {
      return res.status(404).json({
        error: 'Valuation not found',
        message: `No valuation found with ID ${valuationId}`,
      })
    }

    res.json({
      message: 'Valuation deleted successfully',
      deleted,
    })
  } catch (error) {
    console.error('Error deleting valuation:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete valuation',
    })
  }
}

/**
 * POST /api/valuations/:ticker/sensitivity
 * Generate sensitivity analysis
 */
export const getSensitivityAnalysis = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()
    const { valuationId } = req.body

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    const [valuation] = await db
      .select()
      .from(valuations)
      .where(
        and(
          eq(valuations.id, valuationId),
          eq(valuations.companyId, company.id)
        )
      )
      .limit(1)

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found',
        message: `No valuation found with ID ${valuationId}`,
      })
    }

    const fcfProjections = [
      valuation.fcfYear1,
      valuation.fcfYear2,
      valuation.fcfYear3,
      valuation.fcfYear4,
      valuation.fcfYear5,
      valuation.fcfYear6,
      valuation.fcfYear7,
      valuation.fcfYear8,
      valuation.fcfYear9,
      valuation.fcfYear10,
    ]

    // Generate sensitivity table with varying discount and growth rates
    const baseDiscount = parseFloat(valuation.discountRate)
    const baseGrowth = parseFloat(valuation.perpetualGrowthRate)

    const discountRates = [
      baseDiscount - 2,
      baseDiscount - 1,
      baseDiscount,
      baseDiscount + 1,
      baseDiscount + 2,
    ]

    const growthRates = [
      baseGrowth - 1,
      baseGrowth - 0.5,
      baseGrowth,
      baseGrowth + 0.5,
      baseGrowth + 1,
    ]

    const sensitivityTable = generateSensitivityAnalysis(
      fcfProjections,
      valuation.sharesOutstanding,
      discountRates,
      growthRates
    )

    res.json({
      ticker,
      companyName: company.name,
      baseValuation: valuation.intrinsicValuePerShare,
      currentPrice: company.price,
      sensitivityTable,
    })
  } catch (error) {
    console.error('Error generating sensitivity analysis:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate sensitivity analysis',
    })
  }
}
