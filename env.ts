import { env as loadEnv } from 'custom-env';
import { z } from 'zod';

process.env.APP_STAGE = process.env.APP_STAGE || 'dev';

const isDevelopment = process.env.APP_STAGE === 'dev';
const isTesting = process.env.APP_STAGE === 'test';
const isProduction = process.env.APP_STAGE === 'prod';

if (isDevelopment) {
    loadEnv();
} else if (isTesting) {
    loadEnv('test');
}

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    APP_STAGE: z.enum(['dev', 'test', 'prod']),
    PORT: z.coerce.number().positive().default(3000),
    DATABASE_URL: z.string().startsWith('postgresql://')
})

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
    env = envSchema.parse(process.env);
} catch (e) {
    if (e instanceof z.ZodError) {
        console.log('Invalid env configuration');
        console.error(JSON.stringify(z.treeifyError(e), null, 2));

        e.issues.forEach(err => {
            const path = err.path.join('.');
            console.log(`${path}: ${err.message}`);
        })

        process.exit(1);
    }

    throw e
}

export { env };
export default env; 