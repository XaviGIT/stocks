import { bigint, boolean, date, decimal, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const companies = pgTable('companies', {
    id: uuid('id').defaultRandom().primaryKey(),
    ticker: varchar('ticker', {length: 10}).notNull().unique(),
    exchange: varchar('exchange', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }),
    sector: varchar('sector', { length: 100 }),
    category: varchar('category', { length: 50 }),
    price: decimal('price', { precision: 10, scale: 2 }),
    shares: bigint('shares', { mode: 'number'}),

    website: varchar('website', { length: 255}),
    description: text('description'),

    nextEarnings: timestamp('next_earnings'),
    lastFullFetch: timestamp('last_full_fetch'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const companyMetadata = pgTable('company_metadata', {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),

    ipoDate: date('ipo_date'),
    isSpinoff: boolean('is_spinoff').default(false),
    spinoffDate: date('spinoff_date'),
    parentCompany: varchar('parent_company', {length: 255}),
    marketCapCategory: varchar('market_cap_category', { length: 20}), // 'mega', 'large', 'mid', 'small', 'micro', 'nano'
    peterLynchCategory: varchar('peter_lynch_category', { length: 50}), // 'stalwart', 'fast-grower', 'slow-grower', 'cyclical', 'turnaround', 'asset-play'
    isBusinessStable: boolean('is_business_stable').default(false),
    canUnderstandDebt: boolean('can_understand_debt').default(false),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const balanceSheets = pgTable('balance_sheets', {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),    
    periodDate: date('period_date').notNull(),
    
    cashAndEquivalents: bigint('cash_and_equivalents', { mode: 'number'}),
    accountsReceivable: bigint('accounts_receivable', { mode: 'number'}),
    inventories: bigint('inventories', { mode: 'number'}),
    otherCurrentAssets: bigint('other_current_assets', { mode: 'number'}),
    totalCurrentAssets: bigint('total_current_assets', { mode: 'number'}),

    investments: bigint('investiments', { mode: 'number'}),
    propertyPlantEquipment: bigint('property_plant_equipment', { mode: 'number'}),
    goodwill: bigint('goodwill', { mode: 'number'}),
    intangibleAssets: bigint('intangible_assets', { mode: 'number'}),
    otherAssets: bigint('other_assets', { mode: 'number'}),
    totalAssets: bigint('total_assets', { mode: 'number'}),

    shortTermDebt: bigint('short_term_debt', { mode: 'number'}),
    accountsPayable: bigint('accounts_payable', { mode: 'number'}),
    payroll: bigint('payroll', { mode: 'number'}),
    incomeTaxes: bigint('income_taxes', { mode: 'number'}),
    otherCurrentLiabilities: bigint('other_current_liabilities', { mode: 'number'}),
    totalCurrentLiabilities: bigint('total_current_liabilities', { mode: 'number'}),
    longTermDebt: bigint('long_term_debt', { mode: 'number'}),
    otherLiabilities: bigint('other_liabilities', { mode: 'number'}),
    totalLiabilities: bigint('total_liabilities', { mode: 'number'}),

    commonStock: bigint('common_stock', { mode: 'number'}),
    retainedCapital: bigint('retained_capital', { mode: 'number'}),
    accumulatedCompreensiveIncome: bigint('accumulated_compreensive_income', { mode: 'number'}),
    totalStakeholdersEquity: bigint('total_stakeholders_equity', { mode: 'number'}),
    totalLiabilitiesAndStakeholdersEquity: bigint('total_liabilities_and_stakeholders_equity', { mode: 'number'}),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const incomeStatements = pgTable('income_statements', {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),    
    periodDate: date('period_date').notNull(),

    netSales: bigint('net_sales', { mode: 'number'}),
    costOfGoodsSold: bigint('cost_of_goods_sold', { mode: 'number'}),
    grossProfit: bigint('gross_profit', { mode: 'number'}),

    sellingGeneralAdministrative: bigint('selling_general_administrative', { mode: 'number'}),
    researchAndDevelopment: bigint('research_and_development', { mode: 'number'}),
    otherExpensesIncome: bigint('other_expenses_income', { mode: 'number'}), 
    operatingIncome: bigint('operating_income', { mode: 'number'}),

    interestExpense: bigint('interest_expense', { mode: 'number'}),
    otherIncomeExpense: bigint('other_income_expense', { mode: 'number'}),
    pretaxIncome: bigint('pretax_income', { mode: 'number'}),

    incomeTaxes: bigint('income_taxes', { mode: 'number'}),
    netIncome: bigint('net_income', { mode: 'number'}),

    epsBasic: decimal('eps_basic', { precision: 10, scale: 2 }),
    epsDiluted: decimal('eps_diluted', { precision: 10, scale: 2 }),

    weightedAvgSharesOutstanding: bigint('weighted_avg_shares_outstanding', { mode: 'number'}),
    weightedAvgSharesOutstandingDiluted: bigint('weighted_avg_shares_outstanding_diluted', { mode: 'number'}),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cashFlowStatements = pgTable('cash_flow_statements', {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),    
    periodDate: date('period_date').notNull(),

    net_income: bigint('net_income', { mode: 'number'}),
    depreciationamortization: bigint('depreciation_amortization', { mode: 'number'}),
    deferredIncomeTax: bigint('deferred_income_tax', { mode: 'number'}),
    pensionContribution: bigint('pension_contribution', { mode: 'number'}),

    accountsReceivableChange: bigint('accounts_receivable_change', { mode: 'number'}),
    inventoriesChange: bigint('inventories_change', { mode: 'number'}),
    otherCurrentAssetsChange: bigint('other_current_assets_change', { mode: 'number'}),
    otherAssetsChange: bigint('other_assets_change', { mode: 'number'}),
    accountsPayableChange: bigint('accounts_payable_change', { mode: 'number'}),
    otherLiabilitiesChange: bigint('other_liabilities_change', { mode: 'number'}),
    netCashFromOperations: bigint('net_cash_from_operations', { mode: 'number'}),

    capitalExpenditures: bigint('capital_expenditures', { mode: 'number'}),
    acquisitions: bigint('acquisitions', { mode: 'number'}),
    assetSales: bigint('asset_sales', { mode: 'number'}),
    otherInvestingActivities: bigint('other_investing_activities', { mode: 'number'}),
    netCashFromInvesting: bigint('net_cash_from_investing', { mode: 'number'}),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type CompanyMetadata = typeof companyMetadata.$inferSelect;
export type NewCompanyMetadata = typeof companyMetadata.$inferInsert;

export type BalanceSheet = typeof balanceSheets.$inferSelect;
export type NewBalanceSheet = typeof balanceSheets.$inferInsert;

export type IncomeStatement = typeof incomeStatements.$inferSelect;
export type NewincomeStatement = typeof incomeStatements.$inferInsert;

export type CashFlowStatement = typeof cashFlowStatements.$inferSelect;
export type NewcashFlowStatement = typeof cashFlowStatements.$inferInsert;