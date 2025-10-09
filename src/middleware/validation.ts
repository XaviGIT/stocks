import type { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";

export const validateBody = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const validateBody = schema.parse(req.body);
        req.body = validateBody; // coerses from zod
        next()
    } catch (err) {
        if (err instanceof ZodError) {
            return res.status(400).json({
                message: 'Invalid request',
                errors: err.issues
            })
        }
    }
};

export const validateParams = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.params);
        next()
    } catch (err) {
        if (err instanceof ZodError) {
            return res.status(400).json({
                message: 'Invalid request',
                errors: err.issues
            })
        }
    }
};

export const validateQueryParams = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.query);
        next()
    } catch (err) {
        if (err instanceof ZodError) {
            return res.status(400).json({
                message: 'Invalid request',
                errors: err.issues
            })
        }
    }
};