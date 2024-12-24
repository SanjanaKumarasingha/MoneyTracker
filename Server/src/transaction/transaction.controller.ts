// src/transaction/transaction.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from '../entities/transaction.entity';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async findAll(): Promise<Transaction[]> {
    return this.transactionService.findAll();
  }

  @Get('income')
  async findIncomeTransactions(): Promise<Transaction[]> {
    return this.transactionService.findIncomeTransactions();
  }

  @Get('expense')
  async findExpenseTransactions(): Promise<Transaction[]> {
    return this.transactionService.findExpenseTransactions();
  }

//   @Get(':id')
//   async findOne(@Param('id') id: number): Promise<Transaction> {
//     return this.transactionService.findOne(id);
//   }

  @Post('income')
  async createIncome(@Body() data: Partial<Transaction>): Promise<Transaction> {
    data.transactionType = 'income';
    return this.transactionService.createTransaction(data);
  }

  @Post('expense')
  async createExpense(@Body() data: Partial<Transaction>): Promise<Transaction> {
    data.transactionType = 'expense';
    return this.transactionService.createTransaction(data);
  }

  @Put(':id')
  async updateTransaction(
    @Param('id') id: number,
    @Body() data: Partial<Transaction>,
  ): Promise<Transaction> {
    return this.transactionService.updateTransaction(id, data);
  }

  @Delete(':id')
  async removeTransaction(@Param('id') id: number): Promise<void> {
    return this.transactionService.removeTransaction(id);
  }
}
