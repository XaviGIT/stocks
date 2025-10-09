import type { Request, Response } from "express";

export const searchCompany = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Company was found successfully' })
}

export const createCompany = async (req: Request, res: Response) => {
    res.status(201).json({ message: 'Company was created successfully' })
}