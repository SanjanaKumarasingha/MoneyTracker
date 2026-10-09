import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  const userRepository = {
    create: jest.fn((u) => u),
    save: jest.fn(async (u) => ({ id: 1, ...u })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    })
      // Auto-mock every dependency this test doesn't provide itself.
      .useMocker(() => ({}))
      .compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('stores a bcrypt hash, never the plain-text password', async () => {
      await service.create({
        username: 'alice',
        email: 'alice@example.com',
        password: 'plain-text-pw',
      } as any);

      const saved = userRepository.save.mock.calls[0][0];
      expect(saved.password).not.toBe('plain-text-pw');
      await expect(bcrypt.compare('plain-text-pw', saved.password)).resolves.toBe(
        true,
      );
    });
  });

  describe('updatePassword', () => {
    const userWithPassword = async (password: string) =>
      ({ id: 1, password: await bcrypt.hash(password, 4) }) as User;

    it('rejects a wrong old password and saves nothing', async () => {
      const user = await userWithPassword('current-pw');

      await expect(
        service.updatePassword(user, {
          oldPassword: 'wrong-pw',
          newPassword: 'new-pw',
        } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('saves a hash of the new password when the old one matches', async () => {
      const user = await userWithPassword('current-pw');

      await service.updatePassword(user, {
        oldPassword: 'current-pw',
        newPassword: 'new-pw',
      } as any);

      const saved = userRepository.save.mock.calls[0][0];
      expect(saved.id).toBe(1);
      await expect(bcrypt.compare('new-pw', saved.password)).resolves.toBe(
        true,
      );
    });
  });
});
