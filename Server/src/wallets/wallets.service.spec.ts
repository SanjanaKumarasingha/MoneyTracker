import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';

describe('WalletsService', () => {
  let service: WalletsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletsService],
    })
      // Auto-mock every dependency this test doesn't provide itself.
      .useMocker(() => ({}))
      .compile();

    service = module.get<WalletsService>(WalletsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
