import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

describe('WalletsController', () => {
  let controller: WalletsController;

  const walletsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneForUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const usersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        {
          provide: WalletsService,
          useValue: walletsService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
  });

  it('rejects updating another users wallet', async () => {
    walletsService.findOneForUser.mockResolvedValue(undefined);

    await expect(
      controller.update(4, { name: 'Updated', currency: 'USD' }, { user: { id: 1 } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects deleting another users wallet', async () => {
    walletsService.findOneForUser.mockResolvedValue(undefined);

    await expect(
      controller.remove(4, { user: { id: 1 } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
