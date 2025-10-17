import type { Request, Response } from 'express'

import db from '../db/connection.ts'
import {
  balanceSheets,
  cashFlowStatements,
  companies,
  incomeStatements,
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
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    const companyExists = existingCompany.length > 0
    const company = companyExists ? existingCompany[0] : null

    // Determine if we need a full fetch
    const needsFullFetch = await shouldFetchFullData(ticker, company)

    if (needsFullFetch) {
      console.log(`Full fetch required for ${ticker}`)
      const fullData = await getTickerFullData(ticker)

      if (companyExists) {
        await updateCompanyWithFullData(company.id, fullData)
        const updatedCompany = await db
          .select()
          .from(companies)
          .where(eq(companies.id, company.id))
          .limit(1)
        fullData.company = updatedCompany[0]
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

      // Return existing data with updated price
      const [
        updatedCompany,
        balanceSheetsData,
        incomeStatementsData,
        cashFlowsData,
      ] = await Promise.all([
        db
          .select()
          .from(companies)
          .where(eq(companies.id, company!.id))
          .limit(1),
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
        company: updatedCompany[0],
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

  res.status(201).json({ message: 'Company was created successfully' })
}

// helpers

async function shouldFetchFullData(
  ticker: string,
  company: typeof companies.$inferSelect | null
): Promise<boolean> {
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

const insertCompanyWithFullData = async (data: any) => {
  return await db.transaction(async (tx) => {
    const [newCompany] = await tx
      .insert(companies)
      .values(data.company)
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

    return newCompany
  })
}

const updateCompanyWithFullData = async (companyId: string, data: any) => {
  return await db.transaction(async (tx) => {
    await tx
      .update(companies)
      .set({ ...data.company, updatedAt: new Date() })
      .where(eq(companies.id, companyId))

    await tx.delete(balanceSheets).where(eq(balanceSheets.companyId, companyId))
    await tx
      .delete(incomeStatements)
      .where(eq(incomeStatements.companyId, companyId))
    await tx
      .delete(cashFlowStatements)
      .where(eq(cashFlowStatements.companyId, companyId))

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

// Add this method to your companies controller

export const getCompanyFinancials = async (req: Request, res: Response) => {
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
    // But if it's already positive in DB, we need to make it negative
    const capExAdjusted = capEx > 0 ? -capEx : capEx
    const currentFCF = operatingCF + capExAdjusted

    res.json({
      ticker,
      companyName: company.name,
      shares: company.shares,
      currentFCF,
      latestPeriod: latestCashFlow?.periodDate || null,
      // Add debug info
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
