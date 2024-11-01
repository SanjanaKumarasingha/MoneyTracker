import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Role } from './role.entity';
import { LinkedAccount } from './linked-account.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  passwordHash: string;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @OneToMany(() => LinkedAccount, (linkedAccount) => linkedAccount.user)
  linkedAccounts: LinkedAccount[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}
