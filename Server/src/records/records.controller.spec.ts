import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

describe('RecordsController', () => {
  let controller: RecordsController;

  const recordsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneForUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getRemarks: jest.fn(),
  };

  const usersService = {
    findById: jest.fn(),
  };

  const walletsService = {
    findOneForUser: jest.fn(),
  };

  const categoriesService = {
    findOneForUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
      providers: [
        {
          provide: RecordsService,
          useValue: recordsService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: WalletsService,
          useValue: walletsService,
        },
        {
          provide: CategoriesService,
          useValue: categoriesService,
        },
      ],
    }).compile();

    controller = module.get<RecordsController>(RecordsController);
  });

  it('rejects creating a record in another users wallet', async () => {
    usersService.findById.mockResolvedValue({ id: 1 });
    walletsService.findOneForUser.mockResolvedValue(undefined);
    categoriesService.findOneForUser.mockResolvedValue({ id: 9 });

    await expect(
      controller.create(
        {
          price: 10,
          remarks: 'Lunch',
          date: new Date('2026-03-16'),
          wallet: { id: 4 } as any,
          category: { id: 9 } as any,
        },
        { user: { id: 1 } },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects reading another users record', async () => {
    recordsService.findOneForUser.mockResolvedValue(undefined);

    await expect(
      controller.findOne(6, { user: { id: 1 } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
