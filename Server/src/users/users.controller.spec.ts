import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories/categories.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersService = {
    findById: jest.fn(),
    updateCategoryOrder: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
  };

  const categoriesService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: CategoriesService,
          useValue: categoriesService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('rejects reading another user profile', async () => {
    await expect(
      controller.findOne(2, { user: { id: 1 } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('updates category order using the route user id', async () => {
    usersService.findById.mockResolvedValue({ id: 1 });
    usersService.updateCategoryOrder.mockResolvedValue({
      id: 1,
      categoryOrder: [5, 7],
    });

    await controller.updateCategoryOrder(
      1,
      { id: 999, categoryOrder: [5, 7] },
      { user: { id: 1 } },
    );

    expect(usersService.updateCategoryOrder).toHaveBeenCalledWith({
      id: 1,
      categoryOrder: [5, 7],
    });
  });
});
