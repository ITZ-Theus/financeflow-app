import 'reflect-metadata'
import bcrypt from 'bcryptjs'
import { AppDataSource } from '../config/database'
import { env } from '../config/env'
import { User } from '../modules/users/user.entity'
import { Category } from '../modules/categories/category.entity'
import { Transaction } from '../modules/transactions/transaction.entity'
import { Goal } from '../modules/goals/goal.entity'

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

const categories: DemoCategory[] = [
  { name: 'Salary', color: '#10b981', icon: 'briefcase', type: 'income' },
  { name: 'Freelance', color: '#38bdf8', icon: 'laptop', type: 'income' },
  { name: 'Housing', color: '#f97316', icon: 'home', type: 'expense' },
  { name: 'Food', color: '#f59e0b', icon: 'shopping-cart', type: 'expense' },
  { name: 'Transport', color: '#8b5cf6', icon: 'car', type: 'expense' },
  { name: 'Health', color: '#ec4899', icon: 'pill', type: 'expense' },
  { name: 'Education', color: '#06b6d4', icon: 'book-open', type: 'expense' },
]

const transactions: DemoTransaction[] = [
  { title: 'Monthly salary', amount: 8200, type: 'income', day: 2, categoryName: 'Salary' },
  { title: 'API landing page project', amount: 1800, type: 'income', day: 8, categoryName: 'Freelance' },
  { title: 'Rent payment', amount: 2100, type: 'expense', day: 5, categoryName: 'Housing' },
  { title: 'Groceries', amount: 486.75, type: 'expense', day: 9, categoryName: 'Food' },
  { title: 'Fuel and rides', amount: 320.4, type: 'expense', day: 13, categoryName: 'Transport' },
  { title: 'Medication', amount: 92.9, type: 'expense', day: 17, categoryName: 'Health' },
  { title: 'Advanced TypeScript course', amount: 229.9, type: 'expense', day: 21, categoryName: 'Education' },
  { title: 'Restaurant', amount: 168.3, type: 'expense', day: 24, categoryName: 'Food' },
]

function getDateInCurrentMonth(day: number): string {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const safeDay = Math.min(day, lastDay)
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), safeDay))

  return date.toISOString().slice(0, 10)
}

async function resetDemoData(userId: string) {
  await AppDataSource.getRepository(Transaction).delete({ userId })
  await AppDataSource.getRepository(Goal).delete({ userId })
  await AppDataSource.getRepository(Category).delete({ userId })
}

export async function seedDemoData() {
  const userRepo = AppDataSource.getRepository(User)
  const categoryRepo = AppDataSource.getRepository(Category)
  const transactionRepo = AppDataSource.getRepository(Transaction)
  const goalRepo = AppDataSource.getRepository(Goal)

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

  for (const item of transactions) {
    const category = savedCategories.get(item.categoryName)
    await transactionRepo.save(transactionRepo.create({
      title: item.title,
      amount: item.amount,
      type: item.type,
      date: getDateInCurrentMonth(item.day),
      description: item.description || null,
      categoryId: category?.id || null,
      userId: user.id,
    }))
  }

  await goalRepo.save([
    goalRepo.create({
      title: 'Emergency fund',
      targetAmount: 25000,
      currentAmount: 14250,
      deadline: getDateInCurrentMonth(28),
      status: 'active',
      userId: user.id,
    }),
    goalRepo.create({
      title: 'International workstation',
      targetAmount: 18000,
      currentAmount: 18000,
      deadline: getDateInCurrentMonth(20),
      status: 'completed',
      userId: user.id,
    }),
  ])

  console.log(`Demo account ready: ${env.demo.email}`)
}

async function run() {
  await AppDataSource.initialize()
  await seedDemoData()
  await AppDataSource.destroy()
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Failed to seed demo data:', err)
    process.exit(1)
  })
}
