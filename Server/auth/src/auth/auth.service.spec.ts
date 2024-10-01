import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
// import { access } from 'fs/promises';
import { JwtModule } from '@nestjs/jwt';
// import { UsersModule } from 'src/users/users.module';
import { jwtConstants } from './constants';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
    imports: [
      // UsersModule,
      JwtModule.register({
        global: true,
        secret: jwtConstants.secret,
        signOptions: { expiresIn: '60s' },
     }),
    ],
      providers: [AuthService],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  // it('should be defined', () => {
  //   expect(service).toBeDefined();
  // });

  it('should return access token', async () => {
    const username = 'test';
    const password = 'test';
    const response = await service.signIn(username, password);
    expect(response.access_token).toBeDefined();
  }
  );

  it('should return UnauthorizedException, password', async () => {
    const username = 'test';  
    const password = 'wrong';
    try {
      await service.signIn(username, password);
    } catch (error) {
      expect(error.status).toBe(401);
    }
  }
  );
});
