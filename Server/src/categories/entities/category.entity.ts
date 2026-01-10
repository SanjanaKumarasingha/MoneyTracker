import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
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
import { IconName, CategoryType } from '../../enums';
import { Record } from '../../records/entities/record.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'categories' })
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ length: 500 })
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Column()
  @ApiProperty({ enum: IconName })
  @IsNotEmpty()
  @IsEnum(IconName)
  icon: IconName;

  @Column({ type: 'boolean' })
  @ApiProperty()
  @IsBoolean()
  enable: boolean;

  @Column()
  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  @IsNotEmpty()
  type: CategoryType;

  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  @Exclude()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.categories)
  @ApiProperty({ type: () => User })
  @JoinColumn()
  user: User;

  @OneToMany(() => Record, (records) => records.category)
  records: Record[];

  constructor(partial: Partial<Category>) {
    super();
    Object.assign(this, partial);
  }
}
