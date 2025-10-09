import { companies, balanceSheets, incomeStatements, cashFlowStatements } from './entities.ts'
import { relations } from "drizzle-orm";

export const companyRelations = relations(companies, ({ many }) => ({
    balanceSheets: many(balanceSheets),
    incomeStatements: many(incomeStatements),
    cashFlowStatements: many(cashFlowStatements)
}));

export const balanceSheetRelations = relations(balanceSheets, ({ one }) => ({
    company: one(companies, {
        fields: [balanceSheets.companyId],
        references: [companies.id]
    })
}));

export const incomeStatementRelations = relations(incomeStatements, ({ one }) => ({
    company: one(companies, {
        fields: [incomeStatements.companyId],
        references: [companies.id]
    })
}));

export const cashFlowsStatementRelations = relations(cashFlowStatements, ({ one }) => ({
    company: one(companies, {
        fields: [cashFlowStatements.companyId],
        references: [companies.id]
    })
}));