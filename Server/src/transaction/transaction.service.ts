// src/transaction/transaction.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.transactionRepository.find({ relations: ['user', 'linkedAccount', 'category', 'currency'] });
  }

  async findIncomeTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { transactionType: 'income' },
      relations: ['user', 'linkedAccount', 'category', 'currency'],
    });
  }

  async findExpenseTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { transactionType: 'expense' },
      relations: ['user', 'linkedAccount', 'category', 'currency'],
    });
  }

  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionRepository.create(data);
    return this.transactionRepository.save(transaction);
  }

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction> {
    await this.transactionRepository.update(id, data);
    return this.findOne(id);
  }

  async removeTransaction(id: number): Promise<void> {
    await this.transactionRepository.delete(id);
  }

  private async findOne(id: number): Promise<Transaction> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['user', 'linkedAccount', 'category', 'currency'],
    });
  }
}
