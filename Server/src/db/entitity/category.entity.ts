import { Exclude } from 'class-transformer';
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
import { Record } from './record.entity';
import { User } from './user.entity';

@Entity({ name: 'categories' })
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column()
  icon: IconName;

  @Column({ type: 'boolean' })
  enable: boolean;

  @Column()
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
  @JoinColumn()
  user: User;

  @OneToMany(() => Record, (records) => records.category)
  records: Record[];

  constructor(partial: Partial<Category>) {
    super();
    Object.assign(this, partial);
  }
}
