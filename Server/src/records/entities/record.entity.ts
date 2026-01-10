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

  @ManyToOne(() => Category, (category) => category.records)
  @ApiProperty({ type: () => Category })
  @JoinColumn()
  category: Category;

  @ManyToOne(() => Wallet, (wallet) => wallet.records)
  @ApiProperty({ type: () => Wallet })
  @JoinColumn()
  wallet: Wallet;

  constructor(partial: Partial<Record>) {
    super();
    Object.assign(this, partial);
  }
}
