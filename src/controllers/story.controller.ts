import type { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import db from '../db/connection.ts'
import { companies, stockStories, storyVersions } from '../db/schema.ts'

/**
 * GET /api/v1/stories/:ticker
 * Get story for a company
 */
export const getStory = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    const [story] = await db
      .select()
      .from(stockStories)
      .where(eq(stockStories.companyId, company.id))
      .limit(1)

    if (!story) {
      // Return empty story structure
      return res.json({
        ticker,
        companyName: company.name,
        story: {
          content: {},
          lastEdited: null,
        },
      })
    }

    res.json({
      ticker,
      companyName: company.name,
      story: {
        id: story.id,
        content: story.content,
        lastEdited: story.lastEdited,
        createdAt: story.createdAt,
      },
    })
  } catch (error) {
    console.error('Error fetching story:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch story',
    })
  }
}

/**
 * PUT /api/v1/stories/:ticker
 * Create or update story
 */
export const upsertStory = async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker.toUpperCase()
    const { content } = req.body

    if (!content) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'content is required',
      })
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, ticker))
      .limit(1)

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No company found with ticker ${ticker}`,
      })
    }

    // Check if story exists
    const [existingStory] = await db
      .select()
      .from(stockStories)
      .where(eq(stockStories.companyId, company.id))
      .limit(1)

    let result

    if (existingStory) {
      // Update existing story
      ;[result] = await db
        .update(stockStories)
        .set({
          content,
          lastEdited: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(stockStories.id, existingStory.id))
        .returning()
    } else {
      // Create new story
      ;[result] = await db
        .insert(stockStories)
        .values({
          companyId: company.id,
          content,
          lastEdited: new Date(),
        })
        .returning()
    }

    res.json({
      ticker,
      companyName: company.name,
      story: result,
    })
  } catch (error) {
    console.error('Error upserting story:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save story',
    })
  }
}
