import yahooFinance from "yahoo-finance2";

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
    const [quote, summaryData, events] = await Promise.all([
        yahooFinance.quote(ticker),
        yahooFinance.quoteSummary(ticker, {
            modules: [
                'assetProfile',
                'summaryDetail',
                'price',
                'defaultKeyStatistics',
                'financialData'
            ]
        }),
        yahooFinance.quoteSummary(ticker, {
            modules: ['calendarEvents']
        })
    ]);

    const nextEarningsDate = getNextEarningsDate(events);
    const companyData = buildCompanyData(ticker, quote, summaryData, nextEarningsDate);

    return {
        company: companyData,
        balanceSheets: [],
        incomeStatements: [],
        cashFlows: [],
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

// export const getTickerFullData = async (ticker: string) => {
//   const [quote, summaryData, balanceSheetsYF, incomeStatementsYF, cashFlowsYF, earningsData] = await Promise.all([
//     yahooFinance.quote(ticker),
//     yahooFinance.quoteSummary(ticker, {
//       modules: [
//         'assetProfile',
//         'summaryDetail',
//         'price',
//         'defaultKeyStatistics',
//         'financialData'
//       ]
//     }),
//     yahooFinance.quoteSummary(ticker, {
//       modules: ['balanceSheetHistory']
//     }),
//     yahooFinance.quoteSummary(ticker, {
//       modules: ['incomeStatementHistory']
//     }),
//     yahooFinance.quoteSummary(ticker, {
//       modules: ['cashflowStatementHistory']
//     }),
//     yahooFinance.quoteSummary(ticker, {
//       modules: ['calendarEvents']
//     })
//   ]);

//   const nextEarningsDate = earningsData.calendarEvents?.earnings?.earningsDate?.[0] 
//     ? new Date(earningsData.calendarEvents.earnings.earningsDate[0])
//     : null;

//   const companyData = {
//     ticker: quote.symbol || ticker,
//     exchange: quote.exchange || '',
//     name: quote.longName || '',
//     sector: summaryData.assetProfile?.sector || null,
//     category: summaryData.assetProfile?.industry || null,
//     price: quote.regularMarketPrice?.toString() || null,
//     shares: summaryData.defaultKeyStatistics?.sharesOutstanding || null,
//     website: summaryData.assetProfile?.website || null,
//     description: summaryData.assetProfile?.longBusinessSummary || null,
//     nextEarnings: nextEarningsDate,
//     lastFullFetch: new Date(),
//   };

//   const balanceSheetsData = balanceSheetsYF.balanceSheetHistory?.balanceSheetStatements?.map(bs => ({
//     periodDate: bs.endDate ? new Date(bs.endDate) : new Date(),
//     cashAndEquivalents: bs.cash || null,
//     accountsReceivable: bs.netReceivables || null,
//     inventories: bs.inventory || null,
//     otherCurrentAssets: bs.otherCurrentAssets || null,
//     totalCurrentAssets: bs.totalCurrentAssets || null,
//     investiments: bs.longTermInvestments || null,
//     propertyPlantEquipment: bs.propertyPlantEquipment || null,
//     goodwill: bs.goodWill || null,
//     intangibleAssets: bs.intangibleAssets || null,
//     otherAssets: bs.otherAssets || null,
//     totalAssets: bs.totalAssets || null,
//     shortTermDebt: bs.shortLongTermDebt || null, // TODO: fix short term debt
//     accountsPayable: bs.accountsPayable || null,
//     payroll: null,
//     incomeTaxes: null,
//     otherCurrentLiabilities: bs.otherCurrentLiab || null,
//     totalCurrentLiabilities: bs.totalCurrentLiabilities || null,
//     longTermDebt: bs.longTermDebt || null,
//     otherLiabilities: bs.otherLiab || null,
//     totalLiabilities: bs.totalLiab || null,
//     commonStock: bs.commonStock || null,
//     retainedCapital: bs.retainedEarnings || null,
//     accumulatedCompreensiveIncome: null,
//     totalStakeholdersEquity: bs.totalStockholderEquity || null,
//     totalLiabilitiesAndStakeholdersEquity: null,
//   })) || [];

//   const incomeStatementsData = incomeStatementsYF.incomeStatementHistory?.incomeStatementHistory?.map(is => ({
//     periodDate: is.endDate ? new Date(is.endDate) : new Date(),
//     netSales: is.totalRevenue || null,
//     costOfGoodsSold: is.costOfRevenue || null,
//     grossProfit: is.grossProfit || null,
//     sellingGeneralAdministrative: is.sellingGeneralAdministrative || null,
//     researchAndDevelopment: is.researchDevelopment || null,
//     otherExpensesIncome: is.otherOperatingExpenses || null,
//     operatingIncome: is.operatingIncome || null,
//     interestExpense: is.interestExpense || null,
//     otherIncomeExpense: is.otherOperatingExpenses || null, // TODO: fix other income expenses
//     pretaxIncome: is.incomeBeforeTax || null,
//     incomeTaxes: is.incomeTaxExpense || null,
//     netIncome: is.netIncome || null,
//     epsBasic: null,
//     epsDiluted: null,
//     weightedAvgSharesOutstanding: null,
//     weightedAvgSharesOutstandingDiluted: null,
//   })) || [];

//   const cashFlowsData = cashFlowsYF.cashflowStatementHistory?.cashflowStatements?.map(cf => ({
//     periodDate: cf.endDate ? new Date(cf.endDate) : new Date(),
//     net_income: cf.netIncome || null,
//     depreciationamortization: cf.depreciation || null,
//     deferredIncomeTax: null, // TODO: fix deferred income tax
//     pensionContribution: null,
//     accountsReceivableChange: cf.changeToAccountReceivables || null,
//     inventoriesChange: cf.changeToInventory || null,
//     otherCurrentAssetsChange: null,
//     otherAssetsChange: cf.changeToNetincome || null,
//     accountsPayableChange: cf.changeToLiabilities || null,
//     otherLiabilitiesChange: null,
//     netCashFromOperations: cf.totalCashFromOperatingActivities || null,
//     capitalExpenditures: cf.capitalExpenditures || null,
//     acquisitions: null,
//     assetSales: null,
//     otherInvestingActivities: cf.otherCashflowsFromInvestingActivities || null,
//     netCashFromInvesting: cf.totalCashflowsFromInvestingActivities || null,
//   })) || [];

//   return {
//     company: companyData,
//     balanceSheets: balanceSheetsData,
//     incomeStatements: incomeStatementsData,
//     cashFlows: cashFlowsData,
//   };
// }