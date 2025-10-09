import { Router } from "express";
import z from "zod";

import { createCompany, searchCompany } from "../controllers/company.controller.ts";
import { validateQueryParams } from "../middleware/validation.ts";

const router = Router();

const searchQueryParamsSchema = z.object({
    term: z.string().min(2)
})

router.get('/', validateQueryParams(searchQueryParamsSchema), searchCompany);

router.get('/:ticker', createCompany)

export default router;