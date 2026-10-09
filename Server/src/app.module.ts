import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { datasource } from './datasource';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { RecordsModule } from './records/records.module';
import { AuthModule } from './auth/auth.module';
import { WalletsModule } from './wallets/wallets.module';
import { GoalsModule } from './goals/goals.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // Default bucket for routes that opt in with ThrottlerGuard (login and
    // sign-up); per-route limits are set with @Throttle where it's used.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return { ...datasource.options } as TypeOrmModuleOptions;
      },
    }),
    UsersModule,
    CategoriesModule,
    RecordsModule,
    AuthModule,
    WalletsModule,
    GoalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
