import type { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import db from '../db/connection.ts'
import { companies, industries } from '../db/schema.ts'
import {
  calculateIndustryMetrics,
  getPeerCompaniesByIndustry,
  getCompanyRankingInIndustry,
} from '../services/industry.service.ts'

/**
 * GET /api/v1/sectors/:ticker
 * Get industry analysis for a company (renamed from sector to industry focus)
 */
export const getSectorAnalysis = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    console.log(`Fetching industry analysis for ${ticker}`)

    // Get the target company with industry and sector relations
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

    console.log(`Found company: ${targetCompany.name}`)
    console.log(`Industry ID: ${targetCompany.industryId}`)
    console.log(`Industry: ${targetCompany.industry?.name}`)

    if (!targetCompany.industryId || !targetCompany.industry) {
      return res.status(404).json({
        error: 'Industry not defined',
        message: `Company ${ticker} does not have an industry assigned. Category in DB: ${targetCompany.category}`,
      })
    }

    // Calculate industry metrics (more specific than sector)
    console.log(
      `Calculating metrics for industry: ${targetCompany.industry.name}`
    )
    const industryMetrics = await calculateIndustryMetrics(
      targetCompany.industryId
    )

    if (!industryMetrics) {
      return res.status(500).json({
        error: 'Failed to calculate industry metrics',
        message: 'Unable to compute metrics for this industry',
      })
    }

    console.log(`Found ${industryMetrics.totalCompanies} companies in industry`)

    // Get peer companies in the same industry
    const peers = await getPeerCompaniesByIndustry(
      targetCompany.id,
      targetCompany.industryId,
      15 // Get top 15 peers
    )

    console.log(`Found ${peers.length} peer companies`)

    // Get company ranking within industry
    const rankings = await getCompanyRankingInIndustry(
      targetCompany.id,
      targetCompany.industryId
    )

    // Build response
    const response = {
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
    }

    console.log('Successfully built industry analysis response')
    res.json(response)
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
 * Get detailed peer comparison for companies in the same industry
 */
export const getPeerComparison = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20

    // Validate limit
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 50',
      })
    }

    console.log(`Fetching ${limit} peers for ${ticker}`)

    // Get target company with industry
    const targetCompany = await db.query.companies.findFirst({
      where: eq(companies.ticker, ticker),
      with: {
        industry: true,
      },
    })

    if (!targetCompany) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    if (!targetCompany.industryId) {
      return res.status(404).json({
        error: 'Industry not defined',
        message: `Company ${ticker} does not have an industry assigned`,
      })
    }

    const peers = await getPeerCompaniesByIndustry(
      targetCompany.id,
      targetCompany.industryId,
      limit
    )

    res.json({
      ticker: targetCompany.ticker,
      companyName: targetCompany.name,
      industryName: targetCompany.industry?.name || null,
      totalPeers: peers.length,
      peers,
    })
  } catch (error) {
    console.error('Error fetching peer comparison:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch peer comparison',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * GET /api/v1/sectors/list
 * Get list of all industries with basic stats
 * (Keeping the route name as "sectors" for backwards compatibility)
 */
export const getAllSectors = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all industries with stats')

    const allIndustries = await db.query.industries.findMany({
      with: {
        companies: true,
        sector: true,
      },
    })

    const industriesWithStats = allIndustries.map((industry) => {
      const companyCount = industry.companies.length

      // Calculate total market cap
      const totalMarketCap = industry.companies.reduce((sum, company) => {
        const price = company.price ? parseFloat(company.price) : null
        const shares = company.shares
        const marketCap = price && shares ? price * shares : 0
        return sum + marketCap
      }, 0)

      return {
        id: industry.id,
        name: industry.name,
        description: industry.description,
        sector: industry.sector
          ? {
              id: industry.sector.id,
              name: industry.sector.name,
            }
          : null,
        companyCount,
        totalMarketCap,
      }
    })

    // Sort by total market cap descending
    industriesWithStats.sort((a, b) => b.totalMarketCap - a.totalMarketCap)

    // Filter out industries with no companies
    const industriesWithCompanies = industriesWithStats.filter(
      (i) => i.companyCount > 0
    )

    res.json({
      industries: industriesWithCompanies,
      total: industriesWithCompanies.length,
    })
  } catch (error) {
    console.error('Error fetching industries:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch industries',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * GET /api/v1/sectors/industry/:industryName
 * Get details about a specific industry
 */
export const getIndustryDetails = async (req: Request, res: Response) => {
  try {
    const industryName = decodeURIComponent(req.params.industryName)

    console.log(`Fetching details for industry: ${industryName}`)

    const industry = await db.query.industries.findFirst({
      where: eq(industries.name, industryName),
      with: {
        companies: true,
        sector: true,
      },
    })

    if (!industry) {
      return res.status(404).json({
        error: 'Industry not found',
        message: `No industry found with name: ${industryName}`,
      })
    }

    // Calculate metrics
    const metrics = await calculateIndustryMetrics(industry.id)

    res.json({
      industry: {
        id: industry.id,
        name: industry.name,
        description: industry.description,
        sector: industry.sector
          ? {
              id: industry.sector.id,
              name: industry.sector.name,
            }
          : null,
      },
      metrics,
      companies: industry.companies.map((c) => ({
        ticker: c.ticker,
        name: c.name,
        price: c.price,
        shares: c.shares,
      })),
    })
  } catch (error) {
    console.error('Error fetching industry details:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch industry details',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
