import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'

import { isTest } from '../env.ts'
import companyRoutes from './routes/company.routes.ts'
import analysisRoutes from './routes/analysis.routes.ts'
import valuationRoutes from './routes/valuation.routes.ts'
import storyRoutes from './routes/story.routes.ts'
// import sectorRoutes from './routes/sector.routes.ts' // Temporarily disabled

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev', () => !isTest()))

app.get('/api/v1/health', (_, res) => {
  res.sendStatus(200)
})

app.use('/api/v1/companies', companyRoutes)

app.use('/api/v1/analysis', analysisRoutes)

app.use('/api/v1/valuations', valuationRoutes)

app.use('/api/v1/stories', storyRoutes)

// app.use('/api/v1/sectors', sectorRoutes) // Temporarily disabled

export { app }
export default app
