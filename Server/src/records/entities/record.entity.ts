import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
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
import { Category } from '../../categories/entities/category.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';

@Entity({ name: 'records' })
export class Record extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @Column({ type: 'date' })
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @Column({ length: 500, nullable: true })
  @IsOptional()
  @ApiProperty({ nullable: true })
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

  // Nullable: a wallet-to-wallet transfer (see isTransfer below) has no real
  // category — it's not spending or earning, just money moving between two
  // of the user's own wallets. RecordsService attaches a display-only
  // synthetic category on read so existing render/balance code that expects
  // `record.category.{name,icon,type}` doesn't need to special-case this.
  @ManyToOne(() => Category, (category) => category.records, {
    nullable: true,
  })
  @ApiProperty({ type: () => Category, nullable: true })
  @JoinColumn()
  category: Category | null;

  @ManyToOne(() => Wallet, (wallet) => wallet.records)
  @ApiProperty({ type: () => Wallet })
  @JoinColumn()
  wallet: Wallet;

  // True for both halves of a wallet-to-wallet transfer (see
  // RecordsService.transfer). Lets report/chart aggregation exclude
  // transfers from category-based breakdowns while still counting them
  // toward each wallet's plain income/expense totals (the transfer really
  // did move money in/out of that wallet).
  @Column({ default: false })
  @ApiProperty()
  isTransfer: boolean;

  // Only set when isTransfer is true: which side of the transfer this row
  // is. Drives the synthetic category's type ('out' -> expense-shaped,
  // 'in' -> income-shaped) since there's no real Category to read it from.
  @Column({ type: 'varchar', length: 3, nullable: true })
  @ApiProperty({ enum: ['in', 'out'], nullable: true })
  transferDirection: 'in' | 'out' | null;

  // Shared between the two Records created by one transfer, so both sides
  // can be found/deleted together. Not used for lookups yet (no index).
  @Column({ type: 'varchar', length: 36, nullable: true })
  @Exclude()
  transferGroupId: string | null;

  constructor(partial: Partial<Record>) {
    super();
    Object.assign(this, partial);
  }
}
