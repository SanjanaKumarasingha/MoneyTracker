import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsISO4217CurrencyCode } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Record } from '../../records/entities/record.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity({ name: 'wallets' })
export class Wallet extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ length: 500 })
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Column()
  @ApiProperty()
  @IsISO4217CurrencyCode()
  currency: string;

  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  @Exclude()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.wallets)
  @ApiProperty({ type: () => User })
  @JoinColumn()
  user: User;

  @OneToMany(() => Record, (record) => record.wallet)
  records: Record[];

  // Categories hidden from this wallet specifically. Categories remain
  // global/shared per-user (see Category entity); this is purely a
  // per-wallet visibility filter, not per-wallet category ownership.
  @ManyToMany(() => Category)
  @JoinTable({
    name: 'wallet_hidden_categories',
    joinColumn: { name: 'walletId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  hiddenCategories: Category[];

  constructor(partial: Partial<Wallet>) {
    super();
    Object.assign(this, partial);
  }
}
