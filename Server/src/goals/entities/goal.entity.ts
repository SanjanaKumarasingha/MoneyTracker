import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateIf,
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
import { GoalType, GoalPeriodType } from '../../enums';
import { User } from '../../users/entities/user.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity({ name: 'goals' })
export class Goal extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ length: 500, nullable: true })
  @ApiProperty({ nullable: true })
  @IsOptional()
  name: string | null;

  @Column()
  @ApiProperty({ enum: GoalType })
  @IsEnum(GoalType)
  @IsNotEmpty()
  type: GoalType;

  @Column()
  @ApiProperty({ enum: GoalPeriodType })
  @IsEnum(GoalPeriodType)
  @IsNotEmpty()
  periodType: GoalPeriodType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  targetAmount: number;

  // Always required. For recurring period types (WEEKLY/MONTHLY/YEARLY) this
  // is the anchor date the period recurs from. For CUSTOM it is the range
  // start.
  @Column({ type: 'date' })
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  // Required only when periodType === CUSTOM; null for recurring types.
  @Column({ type: 'date', nullable: true })
  @ApiProperty({ nullable: true })
  @ValidateIf((o: Goal) => o.periodType === GoalPeriodType.CUSTOM)
  @IsNotEmpty()
  @IsDateString()
  endDate: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  @Exclude()
  deletedAt: Date;

  @ManyToOne(() => User)
  @ApiProperty({ type: () => User })
  @JoinColumn()
  user: User;

  // Every goal belongs to exactly one wallet.
  @ManyToOne(() => Wallet)
  @ApiProperty({ type: () => Wallet })
  @JoinColumn()
  wallet: Wallet;

  // null => wallet-level goal. Non-null => scoped to this category, in this
  // wallet specifically (categories are user-global/wallet-agnostic, so both
  // wallet and category must be stored to express "Food in Cash" vs "Food in
  // Bank").
  @ManyToOne(() => Category, { nullable: true })
  @ApiProperty({ type: () => Category, nullable: true })
  @JoinColumn()
  category: Category | null;

  constructor(partial: Partial<Goal>) {
    super();
    Object.assign(this, partial);
  }
}
