import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm'
import { Transaction } from '../transactions/transaction.entity'
import { Category } from '../categories/category.entity'
import { Goal } from '../goals/goal.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column({ select: false })
  password: string

  @OneToMany(() => Transaction, t => t.user)
  transactions: Transaction[]

  @OneToMany(() => Category, c => c.user)
  categories: Category[]

  @OneToMany(() => Goal, g => g.user)
  goals: Goal[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
