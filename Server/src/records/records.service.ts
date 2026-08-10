import { Injectable } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { TransferRecordDto } from './dto/transfer-record.dto';
import { BulkCreateRecordRowDto } from './dto/bulk-create-records.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Record } from './entities/record.entity';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Category } from '../categories/entities/category.entity';
import {
  attachTransferCategory,
  attachTransferCategories,
} from './transfer-category.util';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(Record)
    private readonly recordRepository: Repository<Record>,
  ) {}

  async create(createRecordDto: CreateRecordDto) {
    const record = await this.recordRepository.create({
      price: createRecordDto.price,
      remarks: createRecordDto.remarks,
      wallet: createRecordDto.wallet,
      category: createRecordDto.category,
      date: createRecordDto.date,
    });

    return await this.recordRepository.save(record);
  }

  async findAll(wallet: Wallet) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .leftJoin('record.wallet', 'wallet')
      .leftJoinAndSelect('record.category', 'category')
      .where('wallet.id = :id', { id: wallet.id })
      .orderBy('record.id', 'DESC')
      .limit(6);

    return attachTransferCategories(await query.getMany());
  }

  // Creates the two Records that make up one wallet-to-wallet transfer
  // (an expense-shaped row in the source wallet, an income-shaped row in
  // the destination) inside a single DB transaction, so a mid-way failure
  // can never leave only one side written. Ownership/self-transfer
  // validation happens in the controller before this is called.
  async transfer(dto: TransferRecordDto, fromWallet: Wallet, toWallet: Wallet) {
    const transferGroupId = randomUUID();

    return await this.recordRepository.manager.transaction(async (manager) => {
      const outRecord = manager.create(Record, {
        price: dto.amount,
        date: dto.date,
        remarks: dto.remarks ?? `Transfer to ${toWallet.name}`,
        wallet: fromWallet,
        category: null,
        isTransfer: true,
        transferDirection: 'out',
        transferGroupId,
      });
      const inRecord = manager.create(Record, {
        price: dto.amount,
        date: dto.date,
        remarks: dto.remarks ?? `Transfer from ${fromWallet.name}`,
        wallet: toWallet,
        category: null,
        isTransfer: true,
        transferDirection: 'in',
        transferGroupId,
      });

      const [savedOut, savedIn] = await manager.save(Record, [
        outRecord,
        inRecord,
      ]);

      return {
        out: attachTransferCategory(savedOut),
        in: attachTransferCategory(savedIn),
      };
    });
  }

  // Creates every row from an imported spreadsheet (see
  // Client/src/pages/ImportPage.tsx) inside a single DB transaction, so a
  // failure partway through never leaves half an import committed - same
  // pattern as transfer() above. Ownership of walletId and every categoryId
  // is verified in the controller before this is called.
  async bulkCreate(wallet: Wallet, rows: BulkCreateRecordRowDto[]) {
    return await this.recordRepository.manager.transaction(async (manager) => {
      const records = rows.map((row) =>
        manager.create(Record, {
          price: row.price,
          date: row.date,
          remarks: row.remarks,
          wallet,
          category: { id: row.categoryId } as Category,
        }),
      );

      return await manager.save(Record, records);
    });
  }

  async findOne(id: number) {
    return await this.recordRepository.findOne({ where: { id } });
  }

  async belongsToUser(recordId: number, userId: number): Promise<boolean> {
    const count = await this.recordRepository
      .createQueryBuilder('record')
      .leftJoin('record.wallet', 'wallet')
      .leftJoin('wallet.user', 'user')
      .where('record.id = :recordId', { recordId })
      .andWhere('user.id = :userId', { userId })
      .getCount();

    return count > 0;
  }

  async update(id: number, updateRecordDto: UpdateRecordDto) {
    const { walletId, categoryId, ...rest } = updateRecordDto;

    return await this.recordRepository.save({
      id: id,
      ...rest,
      ...(walletId !== undefined && { wallet: { id: walletId } as Wallet }),
      ...(categoryId !== undefined && {
        category: { id: categoryId } as Category,
      }),
    });
  }

  async remove(id: number) {
    return await this.recordRepository.softDelete(id);
  }

  async getRemarks(category: Category) {
    return await this.recordRepository.find({
      relations: { category: true },
      where: {
        category: {
          id: category.id,
        },
      },
    });
  }

  // Unlike findAll (capped at 6 most recent records for the record-list UI),
  // this sums *every* record in the given period — Home's aggregate
  // income/expense, the wallet-detail gauge, and the Report screen's category
  // breakdown all need the true total, not a recent-records sample.
  //
  // Accepts either a calendar month (the original shortcut, still used by
  // the wallet-detail gauge) or an explicit start/end range (what Report's
  // weekly/yearly/custom period picker sends) — the "previous period" used
  // for the trend comparison is the immediately preceding range of the same
  // length in either case, computed with UTC date-only arithmetic
  // throughout to avoid the timezone drift the goal-progress endpoint hit
  // (see Server/src/goals/goal-period.util.ts).
  async getWalletSummary(
    walletId: number,
    params: { month?: string } | { start: string; end: string },
  ) {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    let periodStart: string;
    let periodEnd: string;
    let prevStart: string;
    let prevEnd: string;

    if ('start' in params) {
      periodStart = params.start;
      periodEnd = params.end;
      const startMs = new Date(periodStart).getTime();
      const endMs = new Date(periodEnd).getTime();
      const prevEndMs = startMs - MS_PER_DAY;
      const prevStartMs = prevEndMs - (endMs - startMs);
      prevStart = this.toDateOnly(new Date(prevStartMs));
      prevEnd = this.toDateOnly(new Date(prevEndMs));
    } else {
      const month = params.month ?? new Date().toISOString().slice(0, 7);
      const [year, mon] = month.split('-').map(Number);
      periodStart = this.toDateOnly(new Date(Date.UTC(year, mon - 1, 1)));
      periodEnd = this.toDateOnly(new Date(Date.UTC(year, mon, 0)));
      const prevYear = mon === 1 ? year - 1 : year;
      const prevMon = mon === 1 ? 12 : mon - 1;
      prevStart = this.toDateOnly(new Date(Date.UTC(prevYear, prevMon - 1, 1)));
      prevEnd = this.toDateOnly(new Date(Date.UTC(prevYear, prevMon, 0)));
    }

    const currentRows = await this.categoryTotals(walletId, periodStart, periodEnd);
    const previousRows = await this.categoryTotals(walletId, prevStart, prevEnd);
    const previousByCategory = new Map(
      previousRows.map((r) => [Number(r.categoryId), Number(r.amount)]),
    );

    const categories = currentRows.map((r) => ({
      categoryId: Number(r.categoryId),
      name: r.name,
      icon: r.icon,
      type: r.type,
      amount: Number(r.amount),
      previousAmount: previousByCategory.get(Number(r.categoryId)) ?? 0,
    }));

    const income = categories
      .filter((c) => c.type === 'income')
      .reduce((sum, c) => sum + c.amount, 0);
    const expense = categories
      .filter((c) => c.type === 'expense')
      .reduce((sum, c) => sum + c.amount, 0);

    return { periodStart, periodEnd, income, expense, categories };
  }

  private async categoryTotals(walletId: number, start: string, end: string) {
    return await this.recordRepository
      .createQueryBuilder('record')
      .leftJoin('record.wallet', 'wallet')
      .leftJoin('record.category', 'category')
      .where('wallet.id = :walletId', { walletId })
      .andWhere('record.date >= :start', { start })
      .andWhere('record.date <= :end', { end })
      // Transfers move money between the user's own wallets — they're not
      // real spending/earning, so they're excluded from the category
      // breakdown (and therefore from this period's income/expense totals,
      // which are derived from it below). They still count toward each
      // wallet's plain all-time balance via WalletsService.findAll, which
      // is unaffected by this filter.
      .andWhere('record.isTransfer = false')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'name')
      .addSelect('category.icon', 'icon')
      .addSelect('category.type', 'type')
      .addSelect('COALESCE(SUM(record.price), 0)', 'amount')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.icon')
      .addGroupBy('category.type')
      .getRawMany<{
        categoryId: string;
        name: string;
        icon: string;
        type: string;
        amount: string;
      }>();
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
