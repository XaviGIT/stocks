import { Router } from "express";
import z from "zod";
import { validateBody, validateParams } from "../middleware/validation.ts";
import { getQuickAnalysis, updateMetadata } from "../controllers/analysis.controller.ts";

const router = Router();

const tickerParamSchema = z.object({
    ticker: z.string().min(1).max(10)
});

const updateMetadataSchema = z.object({
    peterLynchCategory: z.enum([
        'slow-grower',
        'stalwart', 
        'fast-grower',
        'cyclical',
        'turnaround',
        'asset-play'
    ]).optional(),
    isBusinessStable: z.boolean().optional(),
    canUnderstandDebt: z.boolean().optional()
});

router.get('/:ticker', validateParams(tickerParamSchema), getQuickAnalysis);

router.put('/:ticker', validateParams(tickerParamSchema), validateBody(updateMetadataSchema), updateMetadata);

export default router;