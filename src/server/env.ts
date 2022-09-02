import { z } from 'zod';
import { loadEnvConfig } from '@next/env';

const dev = process.env.NODE_ENV !== 'production';
loadEnvConfig(process.cwd(), dev);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TOKEN: z.string().min(1),
  DATABASE_URL: z.string().url(),
  CLIENT_SECRET: z.string().min(1),
  CLIENT_ID: z.string().regex(/\d+/),
  OWNER_ID: z.string().regex(/\d+/),
  DEV_SERVER: z.string().regex(/\d+/),
  HOST: z.string().url(),
});

const env = envSchema.parse(process.env);

export default env;
