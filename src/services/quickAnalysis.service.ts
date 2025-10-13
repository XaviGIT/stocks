import type { Company, CompanyMetadata, BalanceSheet, IncomeStatement, CashFlowStatement } from "../db/entities.ts";
import * as metrics from "./metrics.service.ts";

export interface QuickAnalysisResult {    
    companyInfo: {
        ticker: string;
        name: string | null;
        price: string | null;
        shares: number | null;
        marketCap: number | null;
        sector: string | null;
        category: string | null;
        exchange: string | null;
    };
    
    metadata: {
        marketCapCategory: string | null;
        peterLynchCategory: string | null;
        ipoDate: Date | null;
        isRecentIPO: boolean;
        isSpinoff: boolean;
        spinoffDate: Date | null;
    };
    
    profitability: {
        everProfitable: boolean;
        currentlyProfitable: boolean;
        yearsOfProfit: number;
        latestOperatingIncome: number | null;
    };
    
    cashFlow: {
        generatesOperatingCF: boolean;
        consistentCashFlow: boolean;
        averageOperatingCF: number | null;
        cfGrowthRate: number | null;
        latestOperatingCF: number | null;
    };
    
    returns: {
        latestROE: number | null;
        avgROE: number | null;
        roeAbove10: boolean;
        financialLeverageRatio: number | null;
        leverageLevel: 'low' | 'moderate' | 'high' | 'excessive' | null;
        debtToEquity: number | null;
    };
    
    earnings: {
        epsHistory: Array<{ year: number; eps: number }>;
        earningsGrowth: number | null;
        consistency: 'stable' | 'growing' | 'erratic' | 'declining' | 'insufficient-data';
        volatilityScore: number | null;
    };
    
    balanceSheet: {
        hasDebt: boolean;
        totalDebt: number;
        totalAssets: number | null;
        totalEquity: number | null;
        debtToEquity: number | null;
        financialLeverageRatio: number | null;
        debtTrend: 'increasing' | 'decreasing' | 'stable' | 'insufficient-data';
        needsDeepDive: boolean;
    };
    
    shares: {
        currentShares: number | null;
        sharesHistory: Array<{ year: number; shares: number }>;
        changePercent_1yr: number | null;
        changePercent_3yr: number | null;
        changePercent_5yr: number | null;
        trend: 'diluting' | 'buying-back' | 'stable' | null;
    };
    
    userInputs: {
        peterLynchCategory: string | null;
        isBusinessStable: boolean | null;
        canUnderstandDebt: boolean | null;
    };
}

export const generateQuickAnalysis = (
    company: Company,
    metadata: CompanyMetadata | null,
    balanceSheets: BalanceSheet[],
    incomeStatements: IncomeStatement[],
    cashFlows: CashFlowStatement[]
): QuickAnalysisResult => {
    
    const price = company.price ? parseFloat(company.price) : null;
    const numberOfShares = company.shares;
    const marketCap = price && numberOfShares ? price * numberOfShares : null;

    // Sort all data by date (most recent first)
    const sortedBalanceSheets = [...balanceSheets].sort((a, b) => 
        new Date(b.periodDate).getTime() - new Date(a.periodDate).getTime()
    );
    const sortedIncomeStatements = [...incomeStatements].sort((a, b) => 
        new Date(b.periodDate).getTime() - new Date(a.periodDate).getTime()
    );
    const sortedCashFlows = [...cashFlows].sort((a, b) => 
        new Date(b.periodDate).getTime() - new Date(a.periodDate).getTime()
    );

    // Get latest balance sheet
    const latestBalanceSheet = sortedBalanceSheets[0] || null;

    // Calculate market cap category    
    const marketCapCategory = metrics.calculateMarketCapCategory(price, numberOfShares);

    // Profitability analysis
    const profitability = metrics.analyzeProfitability(sortedIncomeStatements);

    // Cash flow analysis
    const cashFlow = metrics.analyzeCashFlow(sortedCashFlows);

    // ROE and leverage
    const roeMetrics = metrics.calculateROEMetrics(sortedIncomeStatements, sortedBalanceSheets);
    
    let financialLeverageRatio = null;
    let debtToEquity = null;
    let leverageLevel = null;
    
    if (latestBalanceSheet) {
        financialLeverageRatio = metrics.calculateFinancialLeverageRatio(
            latestBalanceSheet.totalAssets,
            latestBalanceSheet.totalStakeholdersEquity
        );
        
        const totalDebt = metrics.calculateTotalDebt(latestBalanceSheet);
        debtToEquity = metrics.calculateDebtToEquity(totalDebt, latestBalanceSheet.totalStakeholdersEquity);
        
        leverageLevel = metrics.getLeverageLevel(financialLeverageRatio);
    }

    // Earnings consistency
    const earnings = metrics.analyzeEarningsConsistency(sortedIncomeStatements);

    // Balance sheet analysis
    const totalDebt = latestBalanceSheet ? metrics.calculateTotalDebt(latestBalanceSheet) : 0;
    const hasDebt = totalDebt > 0;
    const debtTrend = metrics.analyzeDebtTrend(sortedBalanceSheets);
    
    // Check if needs deep dive (non-bank with high leverage)
    const needsDeepDive = (financialLeverageRatio !== null && financialLeverageRatio > 4) || 
                          (debtToEquity !== null && debtToEquity > 1);

    // Share count analysis
    const shares = metrics.analyzeShareCount(sortedIncomeStatements);

    // Check if recent IPO
    const ipoDate = metadata?.ipoDate ? new Date(metadata.ipoDate) : null;
    const isRecentIPO = metrics.isRecentIPO(ipoDate);

    return {
        companyInfo: {
            ticker: company.ticker,
            name: company.name,
            price: company.price,
            shares: company.shares,
            marketCap,
            sector: company.sector,
            category: company.category,
            exchange: company.exchange,
        },
        
        metadata: {
            marketCapCategory: metadata?.marketCapCategory || marketCapCategory,
            peterLynchCategory: metadata?.peterLynchCategory || null,
            ipoDate,
            isRecentIPO,
            isSpinoff: metadata?.isSpinoff || false,
            spinoffDate: metadata?.spinoffDate ? new Date(metadata.spinoffDate) : null,
        },
        
        profitability,
        cashFlow,
        
        returns: {
            latestROE: roeMetrics.latestROE,
            avgROE: roeMetrics.avgROE,
            roeAbove10: roeMetrics.roeAbove10,
            financialLeverageRatio,
            leverageLevel,
            debtToEquity,
        },
        
        earnings,
        
        balanceSheet: {
            hasDebt,
            totalDebt,
            totalAssets: latestBalanceSheet?.totalAssets || null,
            totalEquity: latestBalanceSheet?.totalStakeholdersEquity || null,
            debtToEquity,
            financialLeverageRatio,
            debtTrend,
            needsDeepDive,
        },
        
        shares,
        
        userInputs: {
            peterLynchCategory: metadata?.peterLynchCategory || null,
            isBusinessStable: metadata?.isBusinessStable || null,
            canUnderstandDebt: metadata?.canUnderstandDebt || null,
        }
    };
};