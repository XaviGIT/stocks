import { date, decimal, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const companies = pgTable('companies', {
    id: uuid('id').defaultRandom().primaryKey(),
    ticker: varchar('ticker', {length: 10}).notNull().unique(),
    exchange: varchar('exchange', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }),
    sector: varchar('sector', { length: 100 }),
    category: varchar('category', { length: 50 }),
    price: decimal('price', { precision: 10, scale: 2 }),
    shares: integer('shares'),

    website: varchar('website', { length: 255}),
    description: text('description'),

    nextEarnings: timestamp('next_earnings'),
    lastFullFetch: timestamp('last_full_fetch'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const balanceSheets = pgTable('balance_sheets', {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),    
    periodDate: date('period_date').notNull(),
    
    cashAndEquivalents: integer('cash_and_equivalents'),
    accountsReceivable: integer('accounts_receivable'),
    inventories: integer('inventories'),
    otherCurrentAssets: integer('other_current_assets'),
    totalCurrentAssets: integer('total_current_assets'),

    investiments: integer('investiments'),
    propertyPlantEquipment: integer('property_plant_equipment'),
    goodwill: integer('goodwill'),
    intangibleAssets: integer('intangible_assets'),
    otherAssets: integer('other_assets'),
    totalAssets: integer('total_assets'),

    shortTermDebt: integer('short_term_debt'),
    accountsPayable: integer('accounts_payable'),
    payroll: integer('payroll'),
    incomeTaxes: integer('income_taxes'),
    otherCurrentLiabilities: integer('other_current_liabilities'),
    totalCurrentLiabilities: integer('total_current_liabilities'),
    longTermDebt: integer('long_term_debt'),
    otherLiabilities: integer('other_liabilities'),
    totalLiabilities: integer('total_liabilities'),

    commonStock: integer('common_stock'),
    retainedCapital: integer('retained_capital'),
    accumulatedCompreensiveIncome: integer('accumulated_compreensive_income'),
    totalStakeholdersEquity: integer('total_stakeholders_equity'),
    totalLiabilitiesAndStakeholdersEquity: integer('total_liabilities_and_stakeholders_equity'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const incomeStatements = pgTable('income_statements', {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),    
    periodDate: date('period_date').notNull(),

    netSales: integer('net_sales'),
    costOfGoodsSold: integer('cost_of_goods_sold'),
    grossProfit: integer('gross_profit'),

    sellingGeneralAdministrative: integer('selling_general_administrative'),
    researchAndDevelopment: integer('research_and_development'),
    otherExpensesIncome: integer('other_expenses_income'), 
    operatingIncome: integer('operating_income'),

    interestExpense: integer('interest_expense'),
    otherIncomeExpense: integer('other_income_expense'),
    pretaxIncome: integer('pretax_income'),

    incomeTaxes: integer('income_taxes'),
    netIncome: integer('net_income'),

    epsBasic: decimal('eps_basic', { precision: 10, scale: 2 }),
    epsDiluted: decimal('eps_diluted', { precision: 10, scale: 2 }),

    weightedAvgSharesOutstanding: integer('weighted_avg_shares_outstanding'),
    weightedAvgSharesOutstandingDiluted: integer('weighted_avg_shares_outstanding_diluted'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cashFlowStatements = pgTable('cash_flow_statements', {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),    
    periodDate: date('period_date').notNull(),

    net_income: integer('net_income'),
    depreciationamortization: integer('depreciation_amortization'),
    deferredIncomeTax: integer('deferred_income_tax'),
    pensionContribution: integer('pension_contribution'),

    accountsReceivableChange: integer('accounts_receivable_change'),
    inventoriesChange: integer('inventories_change'),
    otherCurrentAssetsChange: integer('other_current_assets_change'),
    otherAssetsChange: integer('other_assets_change'),
    accountsPayableChange: integer('accounts_payable_change'),
    otherLiabilitiesChange: integer('other_liabilities_change'),
    netCashFromOperations: integer('net_cash_from_operations'),

    capitalExpenditures: integer('capital_expenditures'),
    acquisitions: integer('acquisitions'),
    assetSales: integer('asset_sales'),
    otherInvestingActivities: integer('other_investing_activities'),
    netCashFromInvesting: integer('net_cash_from_investing'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies);
export const selectCompanySchema = createSelectSchema(companies);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type BalanceSheet = typeof balanceSheets.$inferSelect;
export type NewBalanceSheet = typeof balanceSheets.$inferInsert;

export type incomeStatement = typeof incomeStatements.$inferSelect;
export type NewincomeStatement = typeof incomeStatements.$inferInsert;

export type cashFlowStatement = typeof cashFlowStatements.$inferSelect;
export type NewcashFlowStatement = typeof cashFlowStatements.$inferInsert;