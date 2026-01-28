import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { CustomerController } from './controllers/customer.controller';
import { DeliveryController } from './controllers/delivery.controller';
import { ProductController } from './controllers/product.controller';
import { TransactionController } from './controllers/transaction.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [
    ProductController,
    TransactionController,
    CustomerController,
    DeliveryController,
  ],
})
export class PresentationModule {}
