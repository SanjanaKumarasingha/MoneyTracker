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
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Record } from '../../records/entities/record.entity';

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

  constructor(partial: Partial<Wallet>) {
    super();
    Object.assign(this, partial);
  }
}
