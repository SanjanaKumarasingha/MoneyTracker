import { Exclude } from 'class-transformer';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './entities/category.entity';
import { Wallet } from './wallet.entity';

@Entity({ name: 'records' })
export class Record extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ length: 500, nullable: true })
  remarks: string;

  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  @Exclude()
  deletedAt: Date;

  @ManyToOne(() => Category, (category) => category.records)
  @JoinColumn()
  category: Category;

  @ManyToOne(() => Wallet, (wallet) => wallet.records)
  @JoinColumn()
  wallet: Wallet;

  constructor(partial: Partial<Record>) {
    super();
    Object.assign(this, partial);
  }
}
