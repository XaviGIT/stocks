import {
  companies,
  balanceSheets,
  incomeStatements,
  cashFlowStatements,
  companyMetadata,
  valuations,
  stockStories,
  storyVersions,
} from './entities.ts'
import { relations } from 'drizzle-orm'

export const companyRelations = relations(companies, ({ one, many }) => ({
  metadata: one(companyMetadata, {
    fields: [companies.id],
    references: [companyMetadata.companyId],
  }),
  balanceSheets: many(balanceSheets),
  incomeStatements: many(incomeStatements),
  cashFlowStatements: many(cashFlowStatements),
  valuations: many(valuations),
  story: one(stockStories, {
    fields: [companies.id],
    references: [stockStories.companyId],
  }),
}))

export const companyMetadataRelations = relations(
  companyMetadata,
  ({ one }) => ({
    company: one(companies, {
      fields: [companyMetadata.companyId],
      references: [companies.id],
    }),
  })
)

export const balanceSheetRelations = relations(balanceSheets, ({ one }) => ({
  company: one(companies, {
    fields: [balanceSheets.companyId],
    references: [companies.id],
  }),
}))

export const incomeStatementRelations = relations(
  incomeStatements,
  ({ one }) => ({
    company: one(companies, {
      fields: [incomeStatements.companyId],
      references: [companies.id],
    }),
  })
)

export const cashFlowsStatementRelations = relations(
  cashFlowStatements,
  ({ one }) => ({
    company: one(companies, {
      fields: [cashFlowStatements.companyId],
      references: [companies.id],
    }),
  })
)

export const valuationRelations = relations(valuations, ({ one }) => ({
  company: one(companies, {
    fields: [valuations.companyId],
    references: [companies.id],
  }),
}))

export const stockStoryRelations = relations(stockStories, ({ one, many }) => ({
  company: one(companies, {
    fields: [stockStories.companyId],
    references: [companies.id],
  }),
  versions: many(storyVersions),
}))
