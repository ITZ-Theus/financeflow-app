import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm'
import { User } from '../users/user.entity'

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column('decimal', { precision: 10, scale: 2 })
  targetAmount: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentAmount: number

  @Column({ type: 'date' })
  deadline: string

  @Column({ type: 'enum', enum: ['active', 'completed', 'cancelled'], default: 'active' })
  status: 'active' | 'completed' | 'cancelled'

  @Column()
  userId: string

  @ManyToOne(() => User, u => u.goals)
  @JoinColumn({ name: 'userId' })
  user: User

  @CreateDateColumn()
  createdAt: Date
}
