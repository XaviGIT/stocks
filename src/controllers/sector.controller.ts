import type { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import db from '../db/connection.ts'
import { companies } from '../db/schema.ts'
import {
  calculateSectorMetrics,
  getPeerCompanies,
  getCompanyRankingInSector,
  getAllSectorsWithStats,
} from '../services/sector.service.ts'
import {
  calculateIndustryMetrics,
  getCompanyRankingInIndustry,
  getPeerCompaniesByIndustry,
} from '../services/industry.service.ts'

/**
 * GET /api/v1/sectors/:ticker
 * Get sector analysis for a company
 */
export const getSectorAnalysis = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    // Get the target company with industry relation
    const targetCompany = await db.query.companies.findFirst({
      where: eq(companies.ticker, ticker),
      with: {
        industry: {
          with: {
            sector: true, // Also get the broader sector
          },
        },
      },
    })

    if (!targetCompany) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    if (!targetCompany.industryId || !targetCompany.industry) {
      return res.status(404).json({
        error: 'Industry not defined',
        message: `Company ${ticker} does not have an industry assigned`,
      })
    }

    // Calculate industry metrics (more specific than sector)
    const industryMetrics = await calculateIndustryMetrics(
      targetCompany.industryId
    )

    if (!industryMetrics) {
      return res.status(500).json({
        error: 'Failed to calculate industry metrics',
      })
    }

    // Get peer companies in the same industry
    const peers = await getPeerCompaniesByIndustry(
      targetCompany.id,
      targetCompany.industryId,
      15
    )

    // Get company ranking within industry
    const rankings = await getCompanyRankingInIndustry(
      targetCompany.id,
      targetCompany.industryId
    )

    res.json({
      ticker: targetCompany.ticker,
      companyName: targetCompany.name,
      industry: {
        id: targetCompany.industry.id,
        name: targetCompany.industry.name,
        description: targetCompany.industry.description,
      },
      sector: targetCompany.industry.sector
        ? {
            id: targetCompany.industry.sector.id,
            name: targetCompany.industry.sector.name,
          }
        : null,
      industryOverview: {
        totalCompanies: industryMetrics.totalCompanies,
        avgMarketCap: industryMetrics.avgMarketCap,
        medianMarketCap: industryMetrics.medianMarketCap,
        totalMarketCap: industryMetrics.totalMarketCap,
        avgRevenue: industryMetrics.avgRevenue,
        avgProfitMargin: industryMetrics.avgProfitMargin,
        avgRevenueGrowth: industryMetrics.avgRevenueGrowth,
      },
      companyPosition: {
        marketCapRank: rankings.marketCapRank,
        revenueRank: rankings.revenueRank,
        profitMarginRank: rankings.profitMarginRank,
      },
      peerComparison: peers,
    })
  } catch (error) {
    console.error('Error fetching sector analysis:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch sector analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * GET /api/v1/sectors/:ticker/peers
 * Get detailed peer comparison
 */
export const getPeerComparison = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20

    // Get target company with sector
    const targetCompany = await db.query.companies.findFirst({
      where: eq(companies.ticker, ticker),
      with: {
        sector: true,
      },
    })

    if (!targetCompany) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    if (!targetCompany.sectorId) {
      return res.status(404).json({
        error: 'Sector not defined',
        message: `Company ${ticker} does not have a sector assigned`,
      })
    }

    const peers = await getPeerCompanies(
      targetCompany.id,
      targetCompany.sectorId,
      limit
    )

    res.json({
      ticker: targetCompany.ticker,
      companyName: targetCompany.name,
      sectorName: targetCompany.sector?.name || null,
      peers,
    })
  } catch (error) {
    console.error('Error fetching peer comparison:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch peer comparison',
    })
  }
}

/**
 * GET /api/v1/sectors/list
 * Get list of all sectors with basic stats
 */
export const getAllSectors = async (req: Request, res: Response) => {
  try {
    const sectors = await getAllSectorsWithStats()

    res.json({
      sectors,
      total: sectors.length,
    })
  } catch (error) {
    console.error('Error fetching sectors:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch sectors',
    })
  }
}
