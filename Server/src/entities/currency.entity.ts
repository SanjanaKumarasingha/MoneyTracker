import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity()
export class Currency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g., USD, EUR

  @Column()
  symbol: string; // e.g., $, €

  @Column('decimal', { precision: 10, scale: 4 })
  exchangeRate: number; // exchange rate to a base currency

  @OneToMany(() => Transaction, (transaction) => transaction.currency)
  transactions: Transaction[];
}
