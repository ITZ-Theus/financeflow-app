import * as dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT) || 3333,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'financeflow',
    password: process.env.DB_PASS || 'financeflow123',
    database: process.env.DB_NAME || 'financeflow',
  },
}
