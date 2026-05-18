/*
 * Typed configuration for the Teligencia API.
 * Validates env at boot via Joi. Fails loudly on missing/malformed secrets
 * so the server never starts in a half-configured state (Constitution Rule 4).
 */

import * as Joi from 'joi';

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  supabase: {
    url: string;
    serviceRoleKey: string;
    dbUrl: string;
  };
  clerk: {
    publishableKey: string;
    secretKey: string;
    webhookSigningSecret: string;
    issuer: string;
    jwksUrl: string;
  };
}

export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
  SUPABASE_DB_URL: Joi.string().required(),

  CLERK_PUBLISHABLE_KEY: Joi.string().required(),
  CLERK_SECRET_KEY: Joi.string().required(),
  CLERK_WEBHOOK_SIGNING_SECRET: Joi.string().required(),
  CLERK_ISSUER: Joi.string().uri().required(),
  CLERK_JWKS_URL: Joi.string()
    .uri()
    .default(
      (parent: Record<string, string>) =>
        `${parent.CLERK_ISSUER}/.well-known/jwks.json`,
    ),
});

export function configurationFactory(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    nodeEnv: (process.env.NODE_ENV ?? 'development') as AppConfig['nodeEnv'],
    supabase: {
      url: process.env.SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      dbUrl: process.env.SUPABASE_DB_URL!,
    },
    clerk: {
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
      secretKey: process.env.CLERK_SECRET_KEY!,
      webhookSigningSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET!,
      issuer: process.env.CLERK_ISSUER!,
      jwksUrl:
        process.env.CLERK_JWKS_URL ??
        `${process.env.CLERK_ISSUER}/.well-known/jwks.json`,
    },
  };
}
