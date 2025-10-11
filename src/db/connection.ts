import { Pool } from 'pg';
import { remember } from '@epic-web/remember';
import { drizzle } from 'drizzle-orm/node-postgres';

import env, { isProd } from '../../env.ts';
import * as schema from './schema.ts';

const createPool = () => new Pool({
    connectionString: env.DATABASE_URL
});

let client;

if (isProd()) {
    client = createPool();
} else {
    client = remember('pgClient', () => createPool());    
}

export const db = drizzle(client, { schema });
export default db;