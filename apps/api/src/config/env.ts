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

function getOrigins(value?: string): string[] {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

const jwtSecret = getRequiredProductionValue(
  'JWT_SECRET',
  process.env.JWT_SECRET
) || 'sua_chave_secreta_super_segura_aqui'

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
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: getNumber(process.env.DB_PORT || process.env.MYSQLPORT, 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'financeflow',
    password: process.env.DB_PASS || process.env.MYSQLPASSWORD || 'financeflow123',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'financeflow',
  },
}
