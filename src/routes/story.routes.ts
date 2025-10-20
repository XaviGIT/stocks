import { Router } from 'express'
import { getStory, upsertStory } from '../controllers/story.controller.ts'
import { validateParams } from '../middleware/validation.ts'
import z from 'zod'

const router = Router()

const storySchema = z.object({
  ticker: z.string(),
})

router.get('/:ticker', validateParams(storySchema), getStory)
router.put('/:ticker', validateParams(storySchema), upsertStory)

export default router
