import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import db from "../db/connection.ts";
import { companies, companyMetadata, balanceSheets, incomeStatements, cashFlowStatements, type Company } from "../db/schema.ts";
import { generateQuickAnalysis } from "../services/quickAnalysis.service.ts";

const getAnalysisRequirements = async (company: Company) => {
    // Fetch metadata (may not exist yet)
    const [metadata] = await db
        .select()
        .from(companyMetadata)
        .where(eq(companyMetadata.companyId, company.id))
        .limit(1);

    // Fetch financial statements
    const [balanceSheetsData, incomeStatementsData, cashFlowsData] = await Promise.all([
        db.select().from(balanceSheets).where(eq(balanceSheets.companyId, company.id)),
        db.select().from(incomeStatements).where(eq(incomeStatements.companyId, company.id)),
        db.select().from(cashFlowStatements).where(eq(cashFlowStatements.companyId, company.id))
    ]);

    // Generate analysis
    return {
        metadata: metadata || null,
        balanceSheets: balanceSheetsData,
        incomeStatements: incomeStatementsData,
        cashFlows: cashFlowsData
    }
}

export const getQuickAnalysis = async (req: Request, res: Response) => {
    try {
        const ticker = req.params.ticker.toUpperCase();

        // Fetch company and all related data
        const [company] = await db
            .select()
            .from(companies)
            .where(eq(companies.ticker, ticker))
            .limit(1);

        if (!company) {
            return res.status(404).json({
                error: 'Company not found',
                message: `No company found with ticker ${ticker}`
            });
        }

        const {
            metadata,
            balanceSheets,
            incomeStatements,
            cashFlows
        } = await getAnalysisRequirements(company);

        const analysis = generateQuickAnalysis(
            company,
            metadata,
            balanceSheets,
            incomeStatements,
            cashFlows
        );

        res.json(analysis);
    } catch (err) {
        console.error('Error generating quick analysis:', err);
        res.status(500).json({
            error: 'Analysis generation failed',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};

export const updateMetadata = async (req: Request, res: Response) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        const { peterLynchCategory, isBusinessStable, canUnderstandDebt } = req.body;

        // Find company
        const [company] = await db
            .select()
            .from(companies)
            .where(eq(companies.ticker, ticker))
            .limit(1);

        if (!company) {
            return res.status(404).json({
                error: 'Company not found',
                message: `No company found with ticker ${ticker}`
            });
        }

        // Check if metadata exists
        const [existingMetadata] = await db
            .select()
            .from(companyMetadata)
            .where(eq(companyMetadata.companyId, company.id))
            .limit(1);

        if (existingMetadata) {
            // Update existing metadata
            await db
                .update(companyMetadata)
                .set({
                    peterLynchCategory: peterLynchCategory !== undefined ? peterLynchCategory : existingMetadata.peterLynchCategory,
                    isBusinessStable: isBusinessStable !== undefined ? isBusinessStable : existingMetadata.isBusinessStable,
                    canUnderstandDebt: canUnderstandDebt !== undefined ? canUnderstandDebt : existingMetadata.canUnderstandDebt,
                    updatedAt: new Date()
                })
                .where(eq(companyMetadata.companyId, company.id));
        } else {
            // Create new metadata
            await db
                .insert(companyMetadata)
                .values({
                    companyId: company.id,
                    peterLynchCategory: peterLynchCategory || null,
                    isBusinessStable: isBusinessStable || null,
                    canUnderstandDebt: canUnderstandDebt || null,
                });
        }

        const {
            metadata,
            balanceSheets,
            incomeStatements,
            cashFlows
        } = await getAnalysisRequirements(company);

        const analysis = generateQuickAnalysis(
            company,
            metadata,
            balanceSheets,
            incomeStatements,
            cashFlows
        );

        res.json(analysis);
    } catch (err) {
        console.error('Error updating metadata:', err);
        res.status(500).json({
            error: 'Metadata update failed',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};