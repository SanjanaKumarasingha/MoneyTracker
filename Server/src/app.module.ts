import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { join } from 'path';
import { datasource } from './datasource';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { RecordsModule } from './records/records.module';
import { AuthModule } from './auth/auth.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client/build'),
      exclude: ['/v1/*'],
    }),
    ConfigModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
