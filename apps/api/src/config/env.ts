import * as dotenv from 'dotenv'

dotenv.config()

const nodeEnv = process.env.NODE_ENV || 'development'
const isProduction = nodeEnv === 'production'

function getRequiredProductionValue(name: string, value?: string): string | undefined {
  if (isProduction && !value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '')
}

function getOrigins(value?: string): string[] {
  return (value || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)
}

const jwtSecret = getRequiredProductionValue(
  'JWT_SECRET',
  process.env.JWT_SECRET
) || 'sua_chave_secreta_super_segura_aqui'

const databaseUrl = process.env.DATABASE_URL

export const env = {
  port: getNumber(process.env.PORT, 3333),
  nodeEnv,
  isProduction,
  webUrl: process.env.WEB_URL || '',
  corsOrigins: getOrigins(process.env.WEB_URL),

  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  db: {
    url: databaseUrl,
    ssl: process.env.DB_SSL === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true' || isProduction,
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: getNumber(process.env.DB_PORT || process.env.POSTGRES_PORT, 5432),
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'financeflow',
    password: process.env.DB_PASS || process.env.POSTGRES_PASSWORD || 'financeflow123',
    database: process.env.DB_NAME || process.env.POSTGRES_DB || 'financeflow',
  },

  demo: {
    seedOnStartup: process.env.DEMO_SEED_ON_STARTUP === 'true',
    email: process.env.DEMO_USER_EMAIL || 'demo@financeflow.dev',
    password: process.env.DEMO_USER_PASSWORD || 'FinanceFlow@2026',
  },

  security: {
    bodyLimit: process.env.BODY_LIMIT || '1mb',
    authRateLimitWindowMs: getNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    authRateLimitMax: getNumber(process.env.AUTH_RATE_LIMIT_MAX, 20),
  },
}
