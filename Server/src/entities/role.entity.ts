// src/entities/role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roleName: string;

  @Column('json')
  permissions: Record<string, any>;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
