import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IS_ARRAY,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
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
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ length: 500, unique: true })
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @Column({ length: 500, unique: true })
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Column({})
  @ApiProperty({ writeOnly: true })
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  password: string;

  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  @Exclude()
  deletedAt: Date;

  @OneToMany(() => Wallet, (wallets) => wallets.user)
  wallets: Wallet[];

  @OneToMany(() => Category, (categories) => categories.user)
  categories: Category[];

  @Column({ type: 'simple-array', nullable: true })
  @IsArray()
  @IsOptional()
  @ApiProperty({ nullable: true })
  categoryOrder: number[];

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }
}
