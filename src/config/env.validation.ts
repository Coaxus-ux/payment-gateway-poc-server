/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default('info'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  CORS_ORIGINS: z.string().default(''),
  CORS_METHODS: z.string().default('GET,POST,PATCH,OPTIONS'),
  CORS_HEADERS: z.string().default('Content-Type,Authorization'),
  CORS_CREDENTIALS: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  PAYMENT_BASE_URL: z.string(),
  PAYMENT_PUBLIC_KEY: z.string().optional(),
  PAYMENT_PRIVATE_KEY: z.string().optional(),
  PAYMENT_EVENTS_KEY: z.string().optional(),
  PAYMENT_INTEGRITY_KEY: z.string().optional(),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }
  return parsed.data;
}
