import type { Request, Response } from 'express'

import db from '../db/connection.ts'
import {
  balanceSheets,
  cashFlowStatements,
  companies,
  incomeStatements,
  industries,
  sectors,
} from '../db/schema.ts'
import { desc, eq, ilike, or } from 'drizzle-orm'
import {
  getTickerFullData,
  getTickerPrice,
  searchTerm,
} from '../services/yahoo.service.ts'

export const searchCompany = async (req: Request, res: Response) => {
  try {
    const term = req.query.term as string
    const pattern = `%${term}%`

    const dbResults = await db
      .select({
        ticker: companies.ticker,
        name: companies.name,
        exchange: companies.exchange,
      })
      .from(companies)
      .where(
        or(ilike(companies.ticker, pattern), ilike(companies.name, pattern))
      )
      .limit(10)

    // If we have results from DB, return them
    if (dbResults.length >= 1) {
      return res.status(200).json(dbResults)
    }

    const yahooResults = await searchTerm(term)

    res.status(200).json(yahooResults)
  } catch (err) {
    console.error('Error searching companies:', err)
    res.status(500).json({
      error: 'Searching company failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}

export const getCompany = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    console.info('Getting company from db')

    // Use Drizzle relations to fetch company with sector info
    const existingCompany = await db.query.companies.findFirst({
      where: eq(companies.ticker, ticker),
      with: {
        sector: true, // This will fetch the related sector data
      },
    })

    const companyExists = !!existingCompany
    const company = existingCompany || null

    // Determine if we need a full fetch
    const needsFullFetch = await shouldFetchFullData(company)

    if (needsFullFetch) {
      console.log(`Full fetch required for ${ticker}`)
      const fullData = await getTickerFullData(ticker)

      if (companyExists) {
        await updateCompanyWithFullData(company.id, fullData)

        // Fetch updated company with sector relation
        const updatedCompany = await db.query.companies.findFirst({
          where: eq(companies.id, company.id),
          with: {
            sector: true,
          },
        })

        fullData.company = updatedCompany
      } else {
        console.info(`Fetching ${ticker} full data`)
        const newCompany = await insertCompanyWithFullData(fullData)
        fullData.company = newCompany
        console.info('Fetch finished')
      }

      return res.json(fullData)
    } else {
      console.log(`Quick price update for ${ticker}`)
      const price = await getTickerPrice(ticker)

      // Update price and updatedAt
      await db
        .update(companies)
        .set({
          price,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, company!.id))

      // Fetch all related data including sector
      const [
        updatedCompany,
        balanceSheetsData,
        incomeStatementsData,
        cashFlowsData,
      ] = await Promise.all([
        db.query.companies.findFirst({
          where: eq(companies.id, company!.id),
          with: {
            sector: true,
          },
        }),
        db
          .select()
          .from(balanceSheets)
          .where(eq(balanceSheets.companyId, company!.id))
          .orderBy(desc(balanceSheets.periodDate)),
        db
          .select()
          .from(incomeStatements)
          .where(eq(incomeStatements.companyId, company!.id))
          .orderBy(desc(incomeStatements.periodDate)),
        db
          .select()
          .from(cashFlowStatements)
          .where(eq(cashFlowStatements.companyId, company!.id))
          .orderBy(desc(cashFlowStatements.periodDate)),
      ])

      return res.json({
        company: updatedCompany,
        balanceSheets: balanceSheetsData,
        incomeStatements: incomeStatementsData,
        cashFlows: cashFlowsData,
      })
    }
  } catch (err) {
    console.error('Error getting company:', err)
    res.status(500).json({
      error: 'Fetching company failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}

export const getCompanyFinancials = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    // Use relations for cleaner query
    const company = await db.query.companies.findFirst({
      where: eq(companies.ticker, ticker),
      with: {
        sector: true,
      },
    })

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    // Get the latest cash flow statement
    const [latestCashFlow] = await db
      .select()
      .from(cashFlowStatements)
      .where(eq(cashFlowStatements.companyId, company.id))
      .orderBy(desc(cashFlowStatements.periodDate))
      .limit(1)

    // Calculate FCF: Operating Cash Flow - Capital Expenditures
    const operatingCF = latestCashFlow?.netCashFromOperations || 0
    const capEx = latestCashFlow?.capitalExpenditures || 0

    // CapEx is usually negative, so we need to subtract it (which adds the absolute value)
    const capExAdjusted = capEx > 0 ? -capEx : capEx
    const currentFCF = operatingCF + capExAdjusted

    res.json({
      ticker,
      companyName: company.name,
      shares: company.shares,
      currentFCF,
      latestPeriod: latestCashFlow?.periodDate || null,
      sector: company.sector?.name || null, // Include sector name
      debug: {
        operatingCashFlow: operatingCF,
        capitalExpenditures: capEx,
        capExAdjusted,
        calculation: `${operatingCF} + (${capExAdjusted}) = ${currentFCF}`,
      },
    })
  } catch (error) {
    console.error('Error fetching company financials:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch company financials',
    })
  }
}

export const getFinancialStatements = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    // Get company with sector info
    const company = await db.query.companies.findFirst({
      where: eq(companies.ticker, ticker),
      with: {
        sector: true,
      },
    })

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    // Fetch all three statement types in parallel
    const [balanceSheetsData, incomeStatementsData, cashFlowsData] =
      await Promise.all([
        db
          .select()
          .from(balanceSheets)
          .where(eq(balanceSheets.companyId, company.id))
          .orderBy(desc(balanceSheets.periodDate)),
        db
          .select()
          .from(incomeStatements)
          .where(eq(incomeStatements.companyId, company.id))
          .orderBy(desc(incomeStatements.periodDate)),
        db
          .select()
          .from(cashFlowStatements)
          .where(eq(cashFlowStatements.companyId, company.id))
          .orderBy(desc(cashFlowStatements.periodDate)),
      ])

    // Return formatted response with sector info
    res.json({
      ticker: company.ticker,
      companyName: company.name,
      sector: company.sector?.name || null,
      balanceSheets: balanceSheetsData,
      incomeStatements: incomeStatementsData,
      cashFlows: cashFlowsData,
      metadata: {
        balanceSheetsCount: balanceSheetsData.length,
        incomeStatementsCount: incomeStatementsData.length,
        cashFlowsCount: cashFlowsData.length,
        oldestPeriod:
          balanceSheetsData[balanceSheetsData.length - 1]?.periodDate,
        latestPeriod: balanceSheetsData[0]?.periodDate,
      },
    })
  } catch (error) {
    console.error('Error fetching financial statements:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch financial statements',
    })
  }
}

// helpers

async function shouldFetchFullData(company: any | null): Promise<boolean> {
  if (!company) return true
  if (!company.nextEarnings) return true
  if (!company.lastFullFetch) return true

  const now = new Date()

  if (
    company.nextEarnings <= now &&
    company.nextEarnings > company.lastFullFetch
  ) {
    return true
  }

  const daysSinceLastFetch =
    (now.getTime() - company.lastFullFetch.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceLastFetch > 90) return true

  return false
}

async function findOrCreateSector(
  sectorName: string | null
): Promise<string | null> {
  if (!sectorName) return null

  try {
    // Check if sector exists
    const existingSector = await db.query.sectors.findFirst({
      where: eq(sectors.name, sectorName),
    })

    if (existingSector) {
      return existingSector.id
    }

    // Create new sector
    const [newSector] = await db
      .insert(sectors)
      .values({
        name: sectorName,
        description: null, // Can be populated later
      })
      .returning()

    console.log(`Created new sector: ${sectorName}`)
    return newSector.id
  } catch (error) {
    console.error(`Error finding/creating sector ${sectorName}:`, error)
    return null
  }
}

const insertCompanyWithFullData = async (data: any) => {
  return await db.transaction(async (tx) => {
    const sectorId = await findOrCreateSector(data.company.sector)
    const industryId = await findOrCreateIndustry(
      data.company.category,
      sectorId
    )

    const [newCompany] = await tx
      .insert(companies)
      .values({
        ...data.company,
        sectorId,
        industryId,
      })
      .returning()

    if (data.balanceSheets.length > 0) {
      await tx.insert(balanceSheets).values(
        data.balanceSheets.map((bs: any) => ({
          ...bs,
          companyId: newCompany.id,
        }))
      )
    }

    if (data.incomeStatements.length > 0) {
      await tx.insert(incomeStatements).values(
        data.incomeStatements.map((is: any) => ({
          ...is,
          companyId: newCompany.id,
        }))
      )
    }

    if (data.cashFlows.length > 0) {
      await tx
        .insert(cashFlowStatements)
        .values(
          data.cashFlows.map((cf: any) => ({ ...cf, companyId: newCompany.id }))
        )
    }

    const completeCompany = await tx.query.companies.findFirst({
      where: eq(companies.id, newCompany.id),
      with: {
        sector: true,
      },
    })

    return completeCompany
  })
}

const updateCompanyWithFullData = async (companyId: string, data: any) => {
  return await db.transaction(async (tx) => {
    const sectorId = await findOrCreateSector(data.company.sector)
    const industryId = await findOrCreateIndustry(
      data.company.category,
      sectorId
    )

    await tx
      .update(companies)
      .set({
        ...data.company,
        sectorId,
        industryId,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))

    // Delete existing financial statements
    await tx.delete(balanceSheets).where(eq(balanceSheets.companyId, companyId))
    await tx
      .delete(incomeStatements)
      .where(eq(incomeStatements.companyId, companyId))
    await tx
      .delete(cashFlowStatements)
      .where(eq(cashFlowStatements.companyId, companyId))

    // Insert new financial statements
    if (data.balanceSheets.length > 0) {
      await tx
        .insert(balanceSheets)
        .values(data.balanceSheets.map((bs: any) => ({ ...bs, companyId })))
    }

    if (data.incomeStatements.length > 0) {
      await tx
        .insert(incomeStatements)
        .values(data.incomeStatements.map((is: any) => ({ ...is, companyId })))
    }

    if (data.cashFlows.length > 0) {
      await tx
        .insert(cashFlowStatements)
        .values(data.cashFlows.map((cf: any) => ({ ...cf, companyId })))
    }
  })
}

async function findOrCreateIndustry(
  industryName: string | null,
  sectorId: string | null
): Promise<string | null> {
  if (!industryName) return null

  try {
    // Check if industry exists
    const existingIndustry = await db.query.industries.findFirst({
      where: eq(industries.name, industryName),
    })

    if (existingIndustry) {
      return existingIndustry.id
    }

    // Create new industry
    const [newIndustry] = await db
      .insert(industries)
      .values({
        name: industryName,
        sectorId, // Link to broader sector
        description: null,
      })
      .returning()

    console.log(`Created new industry: ${industryName}`)
    return newIndustry.id
  } catch (error) {
    console.error(`Error finding/creating industry ${industryName}:`, error)
    return null
  }
}
