import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm'
import { User } from '../users/user.entity'

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ default: '#3b82f6' })
  color: string

  @Column({ default: '🏷️' })
  icon: string

  @Column({ type: 'enum', enum: ['income', 'expense'] })
  type: 'income' | 'expense'

  @Column()
  userId: string

  @ManyToOne(() => User, u => u.categories)
  @JoinColumn({ name: 'userId' })
  user: User

  @CreateDateColumn()
  createdAt: Date
}
