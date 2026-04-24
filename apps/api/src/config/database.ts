import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { env } from './env'
import { User } from '../modules/users/user.entity'
import { Transaction } from '../modules/transactions/transaction.entity'
import { Category } from '../modules/categories/category.entity'
import { Goal } from '../modules/goals/goal.entity'

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.db.url,
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.database,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  synchronize: true,
  logging: false,
  entities: [User, Transaction, Category, Goal],
  migrations: [],
})
