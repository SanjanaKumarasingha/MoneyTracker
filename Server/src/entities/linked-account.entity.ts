import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class LinkedAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.linkedAccounts)
  user: User;

  @Column()
  accountName: string;

  @Column()
  provider: string;

  @Column({ default: 'active' })
  accountStatus: string;

  @OneToMany(() => Transaction, (transaction) => transaction.linkedAccount)
  transactions: Transaction[];
}
