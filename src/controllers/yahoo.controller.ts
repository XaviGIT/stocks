import yahooFinance from "yahoo-finance2";
import { getTodayAndXDateFormatted } from "../utils.ts/dates.ts";
import type { NewBalanceSheet, NewincomeStatement } from "../db/schema.ts";

export const searchTerm = async (term: string) => {
    const yahooResults = await yahooFinance.search(term, {
        quotesCount: 10,
        newsCount: 0,
    });
        
    const searchResults = yahooResults.quotes
        ?.filter((quote: any) => quote.symbol && quote.quoteType === 'EQUITY') // Only stocks
        .map((quote: any) => ({
            ticker: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
            exchange: quote.exchange || '',
        }))
        .slice(0, 10) || [];

    return searchResults;    
}

export const getTickerPrice = async (ticker: string) => {
    const quote = await yahooFinance.quote(ticker);
    return quote.regularMarketPrice?.toString();
}

export const getTickerFullData = async (ticker: string) => {
    const [today, tenYearsAgo] = getTodayAndXDateFormatted(10);

    const [quote, summaryData, events, balanceSheets, incomeStatements, cashFlows] = await Promise.all([
        yahooFinance.quote(ticker),
        yahooFinance.quoteSummary(ticker, {
            modules: [
                'assetProfile',
                'summaryDetail',
                'price',
                'defaultKeyStatistics',
                'financialData',
                'balanceSheetHistory',
                'incomeStatementHistory',
                'cashflowStatementHistory',
            ]
        }),
        yahooFinance.quoteSummary(ticker, {
            modules: ['calendarEvents']
        }),
        yahooFinance.fundamentalsTimeSeries(ticker, {
            period1: tenYearsAgo,
            period2: today,
            type: 'annual',
            module: 'balance-sheet'
        }) as unknown as any[],        
        yahooFinance.fundamentalsTimeSeries(ticker, {
            period1: tenYearsAgo,
            type: 'annual',
            module: 'financials'
        }) as unknown as any[],
        yahooFinance.fundamentalsTimeSeries(ticker, {
            period1: tenYearsAgo,
            type: 'annual',
            module: 'cash-flow'
        }) as unknown as any[]
    ]);

    const nextEarningsDate = getNextEarningsDate(events);
    const companyData = buildCompanyData(ticker, quote, summaryData, nextEarningsDate);

    return {
        company: companyData,
        balanceSheets: balanceSheets.map(buildBalanceSheetData),
        incomeStatements: incomeStatements.map(buildIncomeStatementData),
        cashFlows: cashFlows.map(buildCashFlowStatementData)
    };
}

// helpers
const getNextEarningsDate = (events) => {
    return events.calendarEvents?.earnings?.earningsDate?.[0] 
        ? new Date(events.calendarEvents.earnings.earningsDate[0])
        : null;
}

const buildCompanyData = (ticker, quote, summaryData, nextEarnings) => {
    return {
        ticker: quote.symbol || ticker,
        exchange: quote.exchange || '',
        name: quote.longName || '',
        sector: summaryData.assetProfile?.sector || null,
        category: summaryData.assetProfile?.industry || null,
        price: quote.regularMarketPrice?.toString() || null,
        shares: summaryData.defaultKeyStatistics?.sharesOutstanding || null,
        website: summaryData.assetProfile?.website || null,
        description: summaryData.assetProfile?.longBusinessSummary || null,
        nextEarnings,
        lastFullFetch: new Date(),
  };
}

// TODO: check missing properties (goodwill, intangible assets, payroll)
const buildBalanceSheetData = (original): Omit<NewBalanceSheet, "companyId"> => {
    return {
        periodDate: original.date ?? null,
        // current assets
        cashAndEquivalents: original.cashAndCashEquivalents ?? null,
        accountsReceivable: original.accountsReceivable ?? null,
        inventories: original.inventory ?? null,
        otherCurrentAssets: original.otherCurrentAssets ?? null,
        totalCurrentAssets:original.currentAssets ?? null,
        // non-current assets
        investments: original.investmentsAndAdvances ?? null,
        propertyPlantEquipment: original.netPPE ?? null,
        goodwill: original.goodwill ?? null,
        intangibleAssets: original.otherIntangibleAssets ?? null,
        otherAssets: original.otherNonCurrentAssets ?? null,
        totalAssets: original.totalAssets ?? null,
        // current liabilities
        shortTermDebt: original.currentDebt ?? null,
        accountsPayable: original.accountsPayable ?? null,
        payroll: null,
        incomeTaxes: original.incomeTaxPayable ?? null,
        otherCurrentLiabilities: original.otherCurrentLiabilities ?? null,
        totalCurrentLiabilities: original.currentLiabilities ?? null,
        // non-current liabilities
        longTermDebt: original.longTermDebt ?? null,
        otherLiabilities: original.otherNonCurrentLiabilities ?? null,
        totalLiabilities: original.totalLiabilitiesNetMinorityInterest ?? null,
        // equity
        commonStock: original.commonStock ?? null,
        retainedCapital: original.retainedEarnings ?? null,
        accumulatedCompreensiveIncome: original.gainsLossesNotAffectingRetainedEarnings ?? null,
        totalStakeholdersEquity: original.stockholdersEquity ?? null,
        totalLiabilitiesAndStakeholdersEquity: original.totalEquityGrossMinorityInterest 
      ? (original.totalLiabilitiesNetMinorityInterest ?? 0) + original.totalEquityGrossMinorityInterest
      : null,
    }
}

const buildIncomeStatementData = (original): Omit<NewincomeStatement, "companyId"> => {
  return {
    periodDate: original.date,    
    // Revenue and Cost
    netSales: original.totalRevenue ?? original.operatingRevenue ?? null,
    costOfGoodsSold: original.reconciledCostOfRevenue ?? original.costOfRevenue ?? null,
    grossProfit: original.grossProfit ?? null,
    // Operating Expenses
    sellingGeneralAdministrative: original.sellingGeneralAndAdministration ?? null,
    researchAndDevelopment: original.researchAndDevelopment ?? null,
    otherExpensesIncome: original.operatingExpense ?? null,
    operatingIncome: original.operatingIncome ?? original.totalOperatingIncomeAsReported ?? null,    
    // Non-Operating Items
    interestExpense: original.interestExpense ?? original.interestExpenseNonOperating ?? null,
    otherIncomeExpense: original.otherIncomeExpense ?? original.otherNonOperatingIncomeExpenses ?? null,
    // Income and Taxes
    pretaxIncome: original.pretaxIncome ?? null,
    incomeTaxes: original.taxProvision ?? null,
    netIncome: original.netIncome ?? original.netIncomeCommonStockholders ?? null,
    // Per Share Data
    epsBasic: original.basicEPS?.toString() ?? null,
    epsDiluted: original.dilutedEPS?.toString() ?? null,
    // Share Counts
    weightedAvgSharesOutstanding: original.basicAverageShares ?? null,
    weightedAvgSharesOutstandingDiluted: original.dilutedAverageShares ?? null,
  };
};

export const buildCashFlowStatementData = (original) => {
  return {
    periodDate: original.date,    
    // Operating Activities
    net_income: original.netIncomeFromContinuingOperations ?? null,
    depreciationamortization: original.depreciationAndAmortization ?? original.depreciationAmortizationDepletion ?? null,
    deferredIncomeTax: original.deferredTax ?? original.deferredIncomeTax ?? null,
    pensionContribution: null, // Not available in Yahoo Finance original    
    // Working Capital Changes
    accountsReceivableChange: original.changesInAccountReceivables ?? original.changeInReceivables ?? null,
    inventoriesChange: original.changeInInventory ?? null,
    otherCurrentAssetsChange: original.changeInOtherCurrentAssets ?? null,
    otherAssetsChange: null, // Not directly available
    accountsPayableChange: original.changeInAccountPayable ?? original.changeInPayable ?? null,
    otherLiabilitiesChange: original.changeInOtherCurrentLiabilities ?? null,
    
    netCashFromOperations: original.operatingCashFlow ?? original.cashFlowFromContinuingOperatingActivities ?? null,
    // Investing Activities
    capitalExpenditures: original.capitalExpenditure ?? original.purchaseOfPPE ?? null,
    acquisitions: original.purchaseOfBusiness ?? original.netBusinessPurchaseAndSale ?? null,
    assetSales: original.saleOfInvestment ?? null,
    otherInvestingActivities: calculateOtherInvestingActivities(original),
    netCashFromInvesting: original.investingCashFlow ?? original.cashFlowFromContinuingInvestingActivities ?? null,
  };
};

const calculateOtherInvestingActivities = (original): number | null => {
  // Try to use the explicit field first
  if (original.netOtherInvestingChanges !== undefined) {
    return original.netOtherInvestingChanges;
  }
  
  // Otherwise, try to calculate it
  const investingCashFlow = original.investingCashFlow ?? original.cashFlowFromContinuingInvestingActivities;
  const capitalExpenditure = original.capitalExpenditure ?? original.purchaseOfPPE;
  const acquisitions = original.purchaseOfBusiness ?? original.netBusinessPurchaseAndSale;
  const netInvestmentActivity = original.netInvestmentPurchaseAndSale;
  
  if (investingCashFlow !== undefined && 
      capitalExpenditure !== undefined && 
      acquisitions !== undefined) {
    // Other = Total Investing - CapEx - Acquisitions - Net Investment Activity
    const other = investingCashFlow - (capitalExpenditure ?? 0) - (acquisitions ?? 0) - (netInvestmentActivity ?? 0);
    return other;
  }
  
  return null;
}