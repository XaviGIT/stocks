import type { BalanceSheet, CashFlowStatement, IncomeStatement } from "../db/entities.ts";


export const calculateMarketCapCategory = (price: number | null, shares: number | null): string | null => {
    if (!price || !shares) return null;
    
    const marketCap = price * shares;
    
    if (marketCap >= 200_000_000_000) return 'mega';       // $200B+
    if (marketCap >= 10_000_000_000) return 'large';       // $10B - $200B
    if (marketCap >= 2_000_000_000) return 'mid';          // $2B - $10B
    if (marketCap >= 300_000_000) return 'small';          // $300M - $2B
    if (marketCap >= 50_000_000) return 'micro';           // $50M - $300M
    return 'nano';                                          // < $50M
};

export const calculateROE = (netIncome: number | null, equity: number | null): number | null => {
    if (!netIncome || !equity || equity === 0) return null;
    return (netIncome / equity) * 100;
};

export const calculateFinancialLeverageRatio = (totalAssets: number | null, equity: number | null): number | null => {
    if (!totalAssets || !equity || equity === 0) return null;
    return totalAssets / equity;
};

export const calculateDebtToEquity = (totalDebt: number | null, equity: number | null): number | null => {
    if (!equity || equity === 0) return null;
    if (!totalDebt) return 0;
    return totalDebt / equity;
};

export const getLeverageLevel = (leverageRatio: number | null): 'low' | 'moderate' | 'high' | 'excessive' | null => {
    if (leverageRatio === null) return null;
    
    if (leverageRatio < 2) return 'low';
    if (leverageRatio < 3) return 'moderate';
    if (leverageRatio < 4) return 'high';
    return 'excessive';
};

export const calculateTotalDebt = (balanceSheet: BalanceSheet): number => {
    const shortTerm = balanceSheet.shortTermDebt || 0;
    const longTerm = balanceSheet.longTermDebt || 0;
    return shortTerm + longTerm;
};

export const analyzeProfitability = (incomeStatements: IncomeStatement[]) => {
    if (incomeStatements.length === 0) {
        return {
            everProfitable: false,
            currentlyProfitable: false,
            yearsOfProfit: 0,
            latestOperatingIncome: null
        };
    }

    const sortedStatements = [...incomeStatements].sort((a, b) => 
        new Date(b.periodDate).getTime() - new Date(a.periodDate).getTime()
    );

    const latest = sortedStatements[0];
    const profitableYears = sortedStatements.filter(s => (s.operatingIncome || 0) > 0);

    return {
        everProfitable: profitableYears.length > 0,
        currentlyProfitable: (latest.operatingIncome || 0) > 0,
        yearsOfProfit: profitableYears.length,
        latestOperatingIncome: latest.operatingIncome
    };
};

export const analyzeCashFlow = (cashFlows: CashFlowStatement[]) => {
    if (cashFlows.length === 0) {
        return {
            generatesOperatingCF: false,
            consistentCashFlow: false,
            averageOperatingCF: null,
            cfGrowthRate: null,
            latestOperatingCF: null,
            cashFlowHistory: []
        };
    }

    const sortedCF = [...cashFlows].sort((a, b) => 
        new Date(b.periodDate).getTime() - new Date(a.periodDate).getTime()
    );

    const latest = sortedCF[0];
    const positiveCF = sortedCF.filter(cf => (cf.netCashFromOperations || 0) > 0);
    
    const total = sortedCF.reduce((sum, cf) => sum + (cf.netCashFromOperations || 0), 0);
    const average = total / sortedCF.length;

    // Calculate CAGR if we have enough data
    let cagr = null;
    if (sortedCF.length >= 2) {
        const oldest = sortedCF[sortedCF.length - 1];
        const oldestCF = oldest.netCashFromOperations || 0;
        const latestCF = latest.netCashFromOperations || 0;
        
        if (oldestCF > 0 && latestCF > 0) {
            const years = sortedCF.length - 1;
            cagr = (Math.pow(latestCF / oldestCF, 1 / years) - 1) * 100;
        }
    }

    // Build cash flow history array (oldest to newest for chart display)
    const cashFlowHistory = [...sortedCF]
        .reverse() // Oldest first for chronological order
        .map(cf => ({
            year: new Date(cf.periodDate).getFullYear(),
            amount: cf.netCashFromOperations || 0
        }));

    return {
        generatesOperatingCF: (latest.netCashFromOperations || 0) > 0,
        consistentCashFlow: positiveCF.length >= 3,
        averageOperatingCF: average,
        cfGrowthRate: cagr,
        latestOperatingCF: latest.netCashFromOperations,
        cashFlowHistory
    };
};

export const calculateROEMetrics = (incomeStatements: IncomeStatement[], balanceSheets: BalanceSheet[]) => {
    if (incomeStatements.length === 0 || balanceSheets.length === 0) {
        return {
            latestROE: null,
            avgROE: null,
            roeAbove10: false
        };
    }

    const roeValues: number[] = [];

    for (const statement of incomeStatements) {
        const balanceSheet = balanceSheets.find(bs => bs.periodDate === statement.periodDate);
        if (balanceSheet && statement.netIncome && balanceSheet.totalStakeholdersEquity) {
            const roe = calculateROE(statement.netIncome, balanceSheet.totalStakeholdersEquity);
            if (roe !== null) roeValues.push(roe);
        }
    }

    if (roeValues.length === 0) {
        return {
            latestROE: null,
            avgROE: null,
            roeAbove10: false
        };
    }

    const latestROE = roeValues[0];
    const avgROE = roeValues.reduce((sum, val) => sum + val, 0) / roeValues.length;

    return {
        latestROE,
        avgROE,
        roeAbove10: latestROE >= 10
    };
};

export const analyzeEarningsConsistency = (incomeStatements: IncomeStatement[]) => {
    if (incomeStatements.length < 2) {
        return {
            epsHistory: [],
            earningsGrowth: null,
            consistency: 'insufficient-data' as const,
            volatilityScore: null
        };
    }

    const sortedStatements = [...incomeStatements].sort((a, b) => 
        new Date(a.periodDate).getTime() - new Date(b.periodDate).getTime()
    );

    const epsHistory = sortedStatements.map(s => ({
        year: new Date(s.periodDate).getFullYear(),
        eps: parseFloat(s.epsDiluted || '0')
    }));

    // Calculate year-over-year growth rates
    const growthRates: number[] = [];
    for (let i = 1; i < epsHistory.length; i++) {
        if (epsHistory[i - 1].eps > 0) {
            const growthRate = ((epsHistory[i].eps - epsHistory[i - 1].eps) / epsHistory[i - 1].eps) * 100;
            growthRates.push(growthRate);
        }
    }

    // Calculate CAGR
    let cagr = null;
    const firstEPS = epsHistory[0].eps;
    const lastEPS = epsHistory[epsHistory.length - 1].eps;
    if (firstEPS > 0 && lastEPS > 0) {
        const years = epsHistory.length - 1;
        cagr = (Math.pow(lastEPS / firstEPS, 1 / years) - 1) * 100;
    }

    // Calculate volatility (standard deviation of growth rates)
    let volatility = null;
    if (growthRates.length > 0) {
        const mean = growthRates.reduce((sum, val) => sum + val, 0) / growthRates.length;
        const squaredDiffs = growthRates.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / growthRates.length;
        volatility = Math.sqrt(variance);
    }

    // Determine consistency
    let consistency: 'stable' | 'growing' | 'erratic' | 'declining' = 'stable';
    if (volatility !== null) {
        if (volatility > 30) {
            consistency = 'erratic';
        } else if (cagr !== null) {
            if (cagr > 10) consistency = 'growing';
            else if (cagr < -5) consistency = 'declining';
            else consistency = 'stable';
        }
    }

    return {
        epsHistory,
        earningsGrowth: cagr,
        consistency,
        volatilityScore: volatility
    };
};

export const analyzeDebtTrend = (balanceSheets: BalanceSheet[]) => {
    if (balanceSheets.length < 2) {
        return 'insufficient-data' as const;
    }

    const sortedSheets = [...balanceSheets].sort((a, b) => 
        new Date(a.periodDate).getTime() - new Date(b.periodDate).getTime()
    );

    const debtToAssetRatios = sortedSheets.map(bs => {
        const totalDebt = calculateTotalDebt(bs);
        const totalAssets = bs.totalAssets || 1;
        return totalDebt / totalAssets;
    });

    // Compare most recent 3 periods
    const recentRatios = debtToAssetRatios.slice(-3);
    if (recentRatios.length < 2) return 'stable';

    const firstRatio = recentRatios[0];
    const lastRatio = recentRatios[recentRatios.length - 1];
    const change = lastRatio - firstRatio;

    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
};

export const analyzeShareCount = (incomeStatements: IncomeStatement[]) => {
    if (incomeStatements.length === 0) {
        return {
            currentShares: null,
            sharesHistory: [],
            changePercent_1yr: null,
            changePercent_3yr: null,
            changePercent_5yr: null,
            trend: null
        };
    }

    const sortedStatements = [...incomeStatements].sort((a, b) => 
        new Date(b.periodDate).getTime() - new Date(a.periodDate).getTime()
    );

    const sharesHistory = sortedStatements.map(s => ({
        year: new Date(s.periodDate).getFullYear(),
        shares: s.weightedAvgSharesOutstandingDiluted || s.weightedAvgSharesOutstanding || 0
    }));

    const currentShares = sharesHistory[0]?.shares || null;

    const calculateChange = (yearsAgo: number) => {
        if (sharesHistory.length <= yearsAgo) return null;
        const oldShares = sharesHistory[yearsAgo].shares;
        if (!oldShares || !currentShares) return null;
        return ((currentShares - oldShares) / oldShares) * 100;
    };

    const change1yr = calculateChange(1);
    const change3yr = calculateChange(3);
    const change5yr = calculateChange(5);

    let trend: 'diluting' | 'buying-back' | 'stable' | null = null;
    if (change1yr !== null) {
        if (change1yr > 2) trend = 'diluting';
        else if (change1yr < -2) trend = 'buying-back';
        else trend = 'stable';
    }

    return {
        currentShares,
        sharesHistory,
        changePercent_1yr: change1yr,
        changePercent_3yr: change3yr,
        changePercent_5yr: change5yr,
        trend
    };
};

export const isRecentIPO = (ipoDate: Date | null): boolean => {
    if (!ipoDate) return false;
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return ipoDate > twoYearsAgo;
};