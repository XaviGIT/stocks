import db from '../db/connection.ts'
import {
  companies,
  sectors,
  incomeStatements,
  balanceSheets,
  cashFlowStatements,
} from '../db/schema.ts'
import { eq, and, sql, desc } from 'drizzle-orm'

export interface SectorMetrics {
  sectorId: string
  sectorName: string
  totalCompanies: number
  avgMarketCap: number
  medianMarketCap: number
  totalMarketCap: number
  avgRevenue: number | null
  avgProfitMargin: number | null
  avgRevenueGrowth: number | null
}

export interface PeerCompany {
  id: string
  ticker: string
  name: string
  marketCap: number | null
  revenue: number | null
  profitMargin: number | null
  revenueGrowth: number | null
  price: string | null
}

export interface CompanyRanking {
  metric: string
  rank: number
  total: number
  percentile: number
  value: number | null
}

/**
 * Calculate aggregate metrics for a sector
 */
export async function calculateSectorMetrics(
  sectorId: string
): Promise<SectorMetrics | null> {
  try {
    // Get sector info
    const sector = await db.query.sectors.findFirst({
      where: eq(sectors.id, sectorId),
    })

    if (!sector) return null

    // Get all companies in this sector with their latest financial data
    const companiesInSector = await db.query.companies.findMany({
      where: eq(companies.sectorId, sectorId),
    })

    if (companiesInSector.length === 0) {
      return {
        sectorId: sector.id,
        sectorName: sector.name,
        totalCompanies: 0,
        avgMarketCap: 0,
        medianMarketCap: 0,
        totalMarketCap: 0,
        avgRevenue: null,
        avgProfitMargin: null,
        avgRevenueGrowth: null,
      }
    }

    // Calculate market caps
    const marketCaps = companiesInSector
      .map((c) => {
        const price = c.price ? parseFloat(c.price) : null
        const shares = c.shares
        return price && shares ? price * shares : null
      })
      .filter((mc) => mc !== null) as number[]

    const avgMarketCap =
      marketCaps.length > 0
        ? marketCaps.reduce((sum, mc) => sum + mc, 0) / marketCaps.length
        : 0

    const totalMarketCap =
      marketCaps.length > 0 ? marketCaps.reduce((sum, mc) => sum + mc, 0) : 0

    // Calculate median market cap
    const sortedMarketCaps = [...marketCaps].sort((a, b) => a - b)
    const medianMarketCap =
      sortedMarketCaps.length > 0
        ? sortedMarketCaps[Math.floor(sortedMarketCaps.length / 2)]
        : 0

    // Get latest revenue and profit margins for all companies
    const revenueData: number[] = []
    const profitMarginData: number[] = []
    const revenueGrowthData: number[] = []

    for (const company of companiesInSector) {
      // Get latest income statement
      const [latestIS, previousIS] = await db
        .select()
        .from(incomeStatements)
        .where(eq(incomeStatements.companyId, company.id))
        .orderBy(desc(incomeStatements.periodDate))
        .limit(2)

      if (latestIS) {
        // Revenue
        if (latestIS.netSales) {
          revenueData.push(Number(latestIS.netSales))
        }

        // Profit Margin
        if (latestIS.netSales && latestIS.netIncome) {
          const margin =
            (Number(latestIS.netIncome) / Number(latestIS.netSales)) * 100
          profitMarginData.push(margin)
        }

        // Revenue Growth (YoY)
        if (previousIS && latestIS.netSales && previousIS.netSales) {
          const growth =
            ((Number(latestIS.netSales) - Number(previousIS.netSales)) /
              Number(previousIS.netSales)) *
            100
          revenueGrowthData.push(growth)
        }
      }
    }

    const avgRevenue =
      revenueData.length > 0
        ? revenueData.reduce((sum, r) => sum + r, 0) / revenueData.length
        : null

    const avgProfitMargin =
      profitMarginData.length > 0
        ? profitMarginData.reduce((sum, pm) => sum + pm, 0) /
          profitMarginData.length
        : null

    const avgRevenueGrowth =
      revenueGrowthData.length > 0
        ? revenueGrowthData.reduce((sum, rg) => sum + rg, 0) /
          revenueGrowthData.length
        : null

    return {
      sectorId: sector.id,
      sectorName: sector.name,
      totalCompanies: companiesInSector.length,
      avgMarketCap,
      medianMarketCap,
      totalMarketCap,
      avgRevenue,
      avgProfitMargin,
      avgRevenueGrowth,
    }
  } catch (error) {
    console.error('Error calculating sector metrics:', error)
    return null
  }
}

/**
 * Get peer companies in the same sector
 */
export async function getPeerCompanies(
  companyId: string,
  sectorId: string,
  limit: number = 10
): Promise<PeerCompany[]> {
  try {
    // Get all companies in the same sector except the target company
    const peers = await db.query.companies.findMany({
      where: and(
        eq(companies.sectorId, sectorId),
        sql`${companies.id} != ${companyId}`
      ),
    })

    // Enrich with financial data
    const enrichedPeers: PeerCompany[] = []

    for (const peer of peers.slice(0, limit)) {
      const price = peer.price ? parseFloat(peer.price) : null
      const shares = peer.shares
      const marketCap = price && shares ? price * shares : null

      // Get latest income statement
      const [latestIS, previousIS] = await db
        .select()
        .from(incomeStatements)
        .where(eq(incomeStatements.companyId, peer.id))
        .orderBy(desc(incomeStatements.periodDate))
        .limit(2)

      let revenue = null
      let profitMargin = null
      let revenueGrowth = null

      if (latestIS) {
        revenue = latestIS.netSales ? Number(latestIS.netSales) : null

        if (latestIS.netSales && latestIS.netIncome) {
          profitMargin =
            (Number(latestIS.netIncome) / Number(latestIS.netSales)) * 100
        }

        if (previousIS && latestIS.netSales && previousIS.netSales) {
          revenueGrowth =
            ((Number(latestIS.netSales) - Number(previousIS.netSales)) /
              Number(previousIS.netSales)) *
            100
        }
      }

      enrichedPeers.push({
        id: peer.id,
        ticker: peer.ticker,
        name: peer.name || peer.ticker,
        marketCap,
        revenue,
        profitMargin,
        revenueGrowth,
        price: peer.price,
      })
    }

    // Sort by market cap descending
    enrichedPeers.sort((a, b) => {
      if (a.marketCap === null) return 1
      if (b.marketCap === null) return -1
      return b.marketCap - a.marketCap
    })

    return enrichedPeers
  } catch (error) {
    console.error('Error getting peer companies:', error)
    return []
  }
}

/**
 * Calculate company's ranking within its sector for various metrics
 */
export async function getCompanyRankingInSector(
  companyId: string,
  sectorId: string
): Promise<{
  marketCapRank: CompanyRanking
  revenueRank: CompanyRanking
  profitMarginRank: CompanyRanking
}> {
  try {
    // Get target company
    const targetCompany = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    })

    if (!targetCompany) {
      throw new Error('Target company not found')
    }

    // Get all companies in sector
    const allCompaniesInSector = await db.query.companies.findMany({
      where: eq(companies.sectorId, sectorId),
    })

    const totalCompanies = allCompaniesInSector.length

    // Calculate target company metrics
    const targetPrice = targetCompany.price
      ? parseFloat(targetCompany.price)
      : null
    const targetShares = targetCompany.shares
    const targetMarketCap =
      targetPrice && targetShares ? targetPrice * targetShares : null

    // Get target company financials
    const [targetLatestIS] = await db
      .select()
      .from(incomeStatements)
      .where(eq(incomeStatements.companyId, companyId))
      .orderBy(desc(incomeStatements.periodDate))
      .limit(1)

    const targetRevenue = targetLatestIS?.netSales
      ? Number(targetLatestIS.netSales)
      : null
    const targetProfitMargin =
      targetLatestIS?.netSales && targetLatestIS?.netIncome
        ? (Number(targetLatestIS.netIncome) / Number(targetLatestIS.netSales)) *
          100
        : null

    // Calculate rankings
    const marketCapRanking = await calculateRanking(
      allCompaniesInSector,
      targetMarketCap,
      'marketCap'
    )

    const revenueRanking = await calculateRanking(
      allCompaniesInSector,
      targetRevenue,
      'revenue'
    )

    const profitMarginRanking = await calculateRanking(
      allCompaniesInSector,
      targetProfitMargin,
      'profitMargin'
    )

    return {
      marketCapRank: {
        metric: 'Market Cap',
        rank: marketCapRanking.rank,
        total: totalCompanies,
        percentile: marketCapRanking.percentile,
        value: targetMarketCap,
      },
      revenueRank: {
        metric: 'Revenue',
        rank: revenueRanking.rank,
        total: totalCompanies,
        percentile: revenueRanking.percentile,
        value: targetRevenue,
      },
      profitMarginRank: {
        metric: 'Profit Margin',
        rank: profitMarginRanking.rank,
        total: totalCompanies,
        percentile: profitMarginRanking.percentile,
        value: targetProfitMargin,
      },
    }
  } catch (error) {
    console.error('Error calculating company ranking:', error)
    throw error
  }
}

/**
 * Helper function to calculate ranking for a specific metric
 */
async function calculateRanking(
  companies: any[],
  targetValue: number | null,
  metric: 'marketCap' | 'revenue' | 'profitMargin'
): Promise<{ rank: number; percentile: number }> {
  if (targetValue === null) {
    return { rank: 0, percentile: 0 }
  }

  const values: number[] = []

  for (const company of companies) {
    let value: number | null = null

    if (metric === 'marketCap') {
      const price = company.price ? parseFloat(company.price) : null
      const shares = company.shares
      value = price && shares ? price * shares : null
    } else if (metric === 'revenue' || metric === 'profitMargin') {
      const [latestIS] = await db
        .select()
        .from(incomeStatements)
        .where(eq(incomeStatements.companyId, company.id))
        .orderBy(desc(incomeStatements.periodDate))
        .limit(1)

      if (latestIS) {
        if (metric === 'revenue') {
          value = latestIS.netSales ? Number(latestIS.netSales) : null
        } else if (metric === 'profitMargin') {
          value =
            latestIS.netSales && latestIS.netIncome
              ? (Number(latestIS.netIncome) / Number(latestIS.netSales)) * 100
              : null
        }
      }
    }

    if (value !== null) {
      values.push(value)
    }
  }

  // Sort descending (higher is better)
  values.sort((a, b) => b - a)

  // Find rank
  const rank = values.findIndex((v) => v <= targetValue) + 1
  const percentile = ((values.length - rank + 1) / values.length) * 100

  return {
    rank: rank || values.length,
    percentile: Math.round(percentile),
  }
}

/**
 * Get all sectors with basic stats
 */
export async function getAllSectorsWithStats(): Promise<
  Array<{
    id: string
    name: string
    description: string | null
    companyCount: number
    totalMarketCap: number
  }>
> {
  try {
    const allSectors = await db.query.sectors.findMany({
      with: {
        companies: true,
      },
    })

    const sectorsWithStats = allSectors.map((sector) => {
      const companyCount = sector.companies.length

      // Calculate total market cap
      const totalMarketCap = sector.companies.reduce((sum, company) => {
        const price = company.price ? parseFloat(company.price) : null
        const shares = company.shares
        const marketCap = price && shares ? price * shares : 0
        return sum + marketCap
      }, 0)

      return {
        id: sector.id,
        name: sector.name,
        description: sector.description,
        companyCount,
        totalMarketCap,
      }
    })

    // Sort by total market cap descending
    sectorsWithStats.sort((a, b) => b.totalMarketCap - a.totalMarketCap)

    return sectorsWithStats
  } catch (error) {
    console.error('Error getting all sectors:', error)
    return []
  }
}
