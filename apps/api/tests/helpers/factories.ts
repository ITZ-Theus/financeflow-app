import { User } from '../../src/modules/users/user.entity'
import { Transaction } from '../../src/modules/transactions/transaction.entity'
import { Category } from '../../src/modules/categories/category.entity'
import { Goal } from '../../src/modules/goals/goal.entity'

export function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'user-uuid-1',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  })
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return Object.assign(new Category(), {
    id: 'category-uuid-1',
    name: 'Alimentação',
    color: '#3b82f6',
    icon: '🍔',
    type: 'expense' as const,
    userId: 'user-uuid-1',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  })
}

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return Object.assign(new Transaction(), {
    id: 'transaction-uuid-1',
    title: 'Salário',
    amount: 5000,
    type: 'income' as const,
    date: '2024-01-15',
    description: null,
    categoryId: null,
    userId: 'user-uuid-1',
    createdAt: new Date('2024-01-15'),
    ...overrides,
  })
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return Object.assign(new Goal(), {
    id: 'goal-uuid-1',
    title: 'BMW M2',
    targetAmount: 450000,
    currentAmount: 10000,
    deadline: '2026-12-31',
    status: 'active' as const,
    userId: 'user-uuid-1',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  })
}

/** Cria um mock completo de Repository do TypeORM */
export function makeRepository() {
  return {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  }
}
