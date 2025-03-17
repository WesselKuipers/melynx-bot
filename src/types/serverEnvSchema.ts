import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TOKEN: z.string().min(1),
  DATABASE_URL: z.string().url(),
  OWNER_ID: z.string().regex(/\d+/),
  DEV_SERVER: z.string().regex(/\d+/),
  HOST: z.string().url(),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_CLIENT_SECRET: z.string().regex(/\d+/),
});

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error(envResult.error.issues);
  throw new Error('There is an error with the server environment variables');
}

export const env = envResult.data;
