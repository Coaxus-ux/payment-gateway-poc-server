import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { typeOrmConfig } from './infrastructure/database/typeorm.config';
import { ApplicationModule } from './application/application.module';
import { PaymentModule } from './infrastructure/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    DatabaseModule,
    PaymentModule,
    ApplicationModule,
  ],
})
export class AppModule {}
