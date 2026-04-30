import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
  Index,
} from 'typeorm'
import { User } from '../users/user.entity'
import { Category } from '../categories/category.entity'

@Entity('budgets')
@Index('IDX_budgets_user_category_month_year', ['userId', 'categoryId', 'month', 'year'], { unique: true })
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number

  @Column()
  month: number

  @Column()
  year: number

  @Column()
  categoryId: string

  @Column()
  userId: string

  @ManyToOne(() => User, u => u.budgets)
  @JoinColumn({ name: 'userId' })
  user: User

  @ManyToOne(() => Category, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
