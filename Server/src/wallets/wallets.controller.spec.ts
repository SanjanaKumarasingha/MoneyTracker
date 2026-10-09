import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

describe('WalletsController', () => {
  let controller: WalletsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [WalletsService],
    })
      // Auto-mock every dependency this test doesn't provide itself.
      .useMocker(() => ({}))
      .compile();

    controller = module.get<WalletsController>(WalletsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
