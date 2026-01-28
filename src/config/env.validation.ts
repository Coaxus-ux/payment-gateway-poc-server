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
  WOMPI_BASE_URL: z.string().default('https://sandbox.wompi.co'),
  WOMPI_PUBLIC_KEY: z.string().optional(),
  WOMPI_PRIVATE_KEY: z.string().optional(),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }
  return parsed.data;
}
