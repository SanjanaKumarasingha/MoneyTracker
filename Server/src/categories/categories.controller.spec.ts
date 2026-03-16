import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { UsersService } from '../users/users.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const categoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneForUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const usersService = {
    findById: jest.fn(),
    updateCategoryOrder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: categoriesService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('rejects reading another users category', async () => {
    categoriesService.findOneForUser.mockResolvedValue(undefined);

    await expect(
      controller.findOne(12, { user: { id: 1 } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects deleting another users category', async () => {
    categoriesService.findOneForUser.mockResolvedValue(undefined);

    await expect(
      controller.remove(12, { user: { id: 1 } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
