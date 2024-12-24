// src/entities/transaction.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { LinkedAccount } from './linked-account.entity';
import { Category } from './category.entity';
import { Currency } from './currency.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @ManyToOne(() => LinkedAccount, (linkedAccount) => linkedAccount.transactions)
  linkedAccount: LinkedAccount;

  @ManyToOne(() => Category, (category) => category.transactions)
  category: Category;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => Currency, (currency) => currency.transactions)
  currency: Currency;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['income', 'expense'] })  // New column
  transactionType: 'income' | 'expense';
}
