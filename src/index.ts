import { app } from './server.ts';
import { env } from '../env.ts';

app.listen(env.PORT, () => {
    console.info(`Server is running on http://localhost:${env.PORT}`);
});