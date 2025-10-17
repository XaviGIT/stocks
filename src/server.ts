import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { isTest } from '../env.ts';
import companyRoutes from './routes/company.routes.ts';
import analysisRoutes from './routes/analysis.routes.ts';
import valuationRoutes from './routes/valuation.routes.ts';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', () => !isTest()));

app.get('/api/v1/health', (_, res) => {
    res.sendStatus(200);
});

app.use('/api/v1/companies', companyRoutes);

app.use('/api/v1/analysis', analysisRoutes);

app.use('/api/v1/valuations', valuationRoutes);

export { app };
export default app;
