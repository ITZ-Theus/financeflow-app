import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm'
import { User } from '../users/user.entity'
import { Category } from '../categories/category.entity'

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number

  @Column({ type: 'enum', enum: ['income', 'expense'] })
  type: 'income' | 'expense'

  @Column({ type: 'date' })
  date: string

  @Column({ nullable: true })
  description: string | null

  @Column({ nullable: true })
  categoryId: string | null

  @Column({ default: false })
  isRecurring: boolean

  @Column({ nullable: true })
  recurrenceInterval: 'monthly' | null

  @Column({ type: 'date', nullable: true })
  recurrenceEndDate: string | null

  @Column({ nullable: true })
  parentTransactionId: string | null

  @Column()
  userId: string

  @ManyToOne(() => User, u => u.transactions)
  @JoinColumn({ name: 'userId' })
  user: User

  @ManyToOne(() => Category, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null

  @CreateDateColumn()
  createdAt: Date
}
