import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { LinkedAccount } from './entities/linked-account.entity';
import { Transaction } from './entities/transaction.entity';
import { Category } from './entities/category.entity';
import { Currency } from './entities/currency.entity';
import { NotificationQueue } from './entities/notification-queue.entity';
import { UserModule } from './user/user.module';
import { TransactionController } from './transaction/transaction.controller';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';

@Module({
      imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'money_tracker',
      entities: [User, Role, LinkedAccount, Transaction, Category, Currency, NotificationQueue
      ],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([User, Role, 
      LinkedAccount, Transaction, Category, Currency, NotificationQueue
    ]),
    UserModule,
    TransactionModule,
    AuthModule,
  ],
  controllers: [AppController, TransactionController],
  providers: [AppService],
})
export class AppModule {}