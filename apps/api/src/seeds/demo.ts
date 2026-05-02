import 'reflect-metadata'
import bcrypt from 'bcryptjs'
import { AppDataSource } from '../config/database'
import { env } from '../config/env'
import { User } from '../modules/users/user.entity'
import { Category } from '../modules/categories/category.entity'
import { Transaction } from '../modules/transactions/transaction.entity'
import { Goal } from '../modules/goals/goal.entity'
import { logger } from '../shared/logging/logger'
import { Budget } from '../modules/budgets/budget.entity'

type DemoCategory = {
  name: string
  color: string
  icon: string
  type: 'income' | 'expense'
}

type DemoTransaction = {
  title: string
  amount: number
  type: 'income' | 'expense'
  day: number
  categoryName: string
  description?: string
}

type DemoBudget = {
  categoryName: string
  amount: number
}

const categories: DemoCategory[] = [
  { name: 'Salario', color: '#10b981', icon: 'briefcase', type: 'income' },
  { name: 'Freelance', color: '#38bdf8', icon: 'laptop', type: 'income' },
  { name: 'Moradia', color: '#f97316', icon: 'home', type: 'expense' },
  { name: 'Mercado', color: '#f59e0b', icon: 'shopping-cart', type: 'expense' },
  { name: 'Transporte', color: '#8b5cf6', icon: 'car', type: 'expense' },
  { name: 'Saude', color: '#ec4899', icon: 'pill', type: 'expense' },
  { name: 'Educacao', color: '#06b6d4', icon: 'book-open', type: 'expense' },
  { name: 'Lazer', color: '#22c55e', icon: 'music', type: 'expense' },
  { name: 'Assinaturas', color: '#64748b', icon: 'smartphone', type: 'expense' },
  { name: 'Investimentos', color: '#14b8a6', icon: 'wallet', type: 'expense' },
]

const budgets: DemoBudget[] = [
  { categoryName: 'Mercado', amount: 1400 },
  { categoryName: 'Transporte', amount: 650 },
  { categoryName: 'Saude', amount: 450 },
  { categoryName: 'Educacao', amount: 550 },
  { categoryName: 'Lazer', amount: 700 },
  { categoryName: 'Assinaturas', amount: 220 },
]

function getDateInMonth(year: number, monthIndex: number, day: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const safeDay = Math.min(day, lastDay)
  const date = new Date(Date.UTC(year, monthIndex, safeDay))

  return date.toISOString().slice(0, 10)
}

function getMonthByOffset(offset: number) {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)

  return {
    year: date.getFullYear(),
    monthIndex: date.getMonth(),
    month: date.getMonth() + 1,
  }
}

function getDemoTransactionsForMonth(offset: number): DemoTransaction[] {
  const now = new Date()
  const isCurrentMonth = offset === 0
  const currentDay = now.getDate()
  const incomeBoost = offset === -1 ? 900 : offset === -3 ? 500 : 0
  const expenseBoost = offset === -2 ? 260 : offset === -4 ? 180 : 0

  const items: DemoTransaction[] = [
    { title: 'Salario mensal', amount: 8200, type: 'income', day: 1, categoryName: 'Salario' },
    { title: 'Projeto freelance', amount: 1650 + incomeBoost, type: 'income', day: 12, categoryName: 'Freelance' },
    { title: 'Aluguel', amount: 2400, type: 'expense', day: 2, categoryName: 'Moradia' },
    { title: 'Condominio e energia', amount: 520 + expenseBoost, type: 'expense', day: 6, categoryName: 'Moradia' },
    { title: 'Compra do mes', amount: 760 + expenseBoost, type: 'expense', day: 7, categoryName: 'Mercado' },
    { title: 'Reposicao de mercado', amount: 285.9, type: 'expense', day: 18, categoryName: 'Mercado' },
    { title: 'Combustivel e apps', amount: 390 + offset * -12, type: 'expense', day: 10, categoryName: 'Transporte' },
    { title: 'Consulta e farmacia', amount: offset === -1 ? 420 : 185.4, type: 'expense', day: 16, categoryName: 'Saude' },
    { title: 'Curso e livros', amount: offset === -3 ? 620 : 249.9, type: 'expense', day: 20, categoryName: 'Educacao' },
    { title: 'Streaming e ferramentas', amount: 187.8, type: 'expense', day: 5, categoryName: 'Assinaturas' },
    { title: 'Restaurante e cinema', amount: 310 + expenseBoost, type: 'expense', day: 24, categoryName: 'Lazer' },
    { title: 'Aporte em renda fixa', amount: offset === 0 ? 900 : 1200, type: 'expense', day: 26, categoryName: 'Investimentos' },
  ]

  if (offset === -5) {
    items.push({ title: 'Bonus trimestral', amount: 1300, type: 'income', day: 15, categoryName: 'Freelance' })
  }

  if (!isCurrentMonth) {
    return items
  }

  return items
    .filter((item) => item.day <= currentDay || item.day <= 12)
    .map((item) => ({ ...item, day: Math.min(item.day, Math.max(currentDay, 2)) }))
}

async function resetDemoData(userId: string) {
  await AppDataSource.getRepository(Budget).delete({ userId })
  await AppDataSource.getRepository(Transaction).delete({ userId })
  await AppDataSource.getRepository(Goal).delete({ userId })
  await AppDataSource.getRepository(Category).delete({ userId })
}

export async function seedDemoData() {
  const userRepo = AppDataSource.getRepository(User)
  const categoryRepo = AppDataSource.getRepository(Category)
  const transactionRepo = AppDataSource.getRepository(Transaction)
  const goalRepo = AppDataSource.getRepository(Goal)
  const budgetRepo = AppDataSource.getRepository(Budget)

  const password = await bcrypt.hash(env.demo.password, 10)
  let user = await userRepo.findOne({
    where: { email: env.demo.email },
    select: ['id', 'name', 'email', 'password'],
  })

  if (!user) {
    user = userRepo.create({
      name: 'FinanceFlow Demo',
      email: env.demo.email,
      password,
    })
    await userRepo.save(user)
  } else {
    user.name = 'FinanceFlow Demo'
    user.password = password
    await userRepo.save(user)
  }

  await resetDemoData(user.id)

  const savedCategories = new Map<string, Category>()
  for (const item of categories) {
    const category = await categoryRepo.save(categoryRepo.create({ ...item, userId: user.id }))
    savedCategories.set(category.name, category)
  }

  for (let offset = -5; offset <= 0; offset += 1) {
    const { year, monthIndex } = getMonthByOffset(offset)

    for (const item of getDemoTransactionsForMonth(offset)) {
      const category = savedCategories.get(item.categoryName)
      await transactionRepo.save(transactionRepo.create({
        title: item.title,
        amount: Math.round(item.amount * 100) / 100,
        type: item.type,
        date: getDateInMonth(year, monthIndex, item.day),
        description: item.description || null,
        categoryId: category?.id || null,
        userId: user.id,
      }))
    }
  }

  const now = new Date()
  for (const item of budgets) {
    const category = savedCategories.get(item.categoryName)
    if (!category) continue

    await budgetRepo.save(budgetRepo.create({
      amount: item.amount,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      categoryId: category.id,
      userId: user.id,
    }))
  }

  await goalRepo.save([
    goalRepo.create({
      title: 'Reserva de emergencia',
      targetAmount: 25000,
      currentAmount: 16850,
      deadline: getDateInMonth(now.getFullYear(), now.getMonth() + 4, 15),
      status: 'active',
      userId: user.id,
    }),
    goalRepo.create({
      title: 'Setup para trabalho remoto',
      targetAmount: 18000,
      currentAmount: 18000,
      deadline: getDateInMonth(now.getFullYear(), now.getMonth() - 1, 20),
      status: 'completed',
      userId: user.id,
    }),
    goalRepo.create({
      title: 'Viagem internacional',
      targetAmount: 12000,
      currentAmount: 3850,
      deadline: getDateInMonth(now.getFullYear(), now.getMonth() + 8, 10),
      status: 'active',
      userId: user.id,
    }),
  ])

  logger.info({ email: env.demo.email }, 'demo account ready')
}

async function run() {
  await AppDataSource.initialize()
  await seedDemoData()
  await AppDataSource.destroy()
}

if (require.main === module) {
  run().catch((err) => {
    logger.error({ err }, 'failed to seed demo data')
    process.exit(1)
  })
}
