import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = { findByUsername: jest.fn() };
  const jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const storedUser = async () => ({
      id: 7,
      username: 'alice',
      email: 'alice@example.com',
      password: await bcrypt.hash('correct-password', 4),
    });

    it('returns the user without the password hash on a correct password', async () => {
      usersService.findByUsername.mockResolvedValue(await storedUser());

      const result = await service.validateUser('alice', 'correct-password');

      expect(result).toEqual({
        id: 7,
        username: 'alice',
        email: 'alice@example.com',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('rejects a wrong password', async () => {
      usersService.findByUsername.mockResolvedValue(await storedUser());

      await expect(
        service.validateUser('alice', 'wrong-password'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns null for an unknown username', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(service.validateUser('nobody', 'x')).resolves.toBeNull();
    });
  });

  describe('login', () => {
    it('signs a JWT whose subject is the user id', async () => {
      const user = { id: 7, username: 'alice', email: 'alice@example.com' };

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'alice',
        sub: 7,
      });
      expect(result).toEqual({ access_token: 'signed.jwt.token', user });
    });
  });
});
