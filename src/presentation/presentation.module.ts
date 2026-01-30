import { Module } from '@nestjs/common';
import { ApplicationModule } from '@/application/application.module';
import { CustomerController } from './controllers/customer.controller';
import { DeliveryController } from './controllers/delivery.controller';
import { HealthController } from './controllers/health.controller';
import { ProductController } from './controllers/product.controller';
import { TransactionController } from './controllers/transaction.controller';
import { AdminController } from './controllers/admin.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [
    ProductController,
    TransactionController,
    CustomerController,
    DeliveryController,
    HealthController,
    AdminController,
  ],
})
export class PresentationModule {}
