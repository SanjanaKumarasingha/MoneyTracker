import { Exclude } from 'class-transformer';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Category } from './entities/category.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500, unique: true })
  username: string;

  @Column({ length: 500, unique: true })
  email: string;

  @Column({})
  @Exclude({ toPlainOnly: true })
  password: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @OneToMany(() => Wallet, (wallets) => wallets.user)
  wallets: Wallet[];

  @OneToMany(() => Category, (categories) => categories.user)
  categories: Category[];

  @Column({ type: 'simple-array', nullable: true })
  categoryOrder: number[];

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }
}
