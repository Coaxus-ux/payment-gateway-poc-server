import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { PaymentModule } from '@/infrastructure/payment/payment.module';
import { CreateTransactionUseCase } from './use-cases/create-transaction.usecase';
import { GetCustomerUseCase } from './use-cases/get-customer.usecase';
import { GetDeliveryUseCase } from './use-cases/get-delivery.usecase';
import { GetProductUseCase } from './use-cases/get-product.usecase';
import { GetTransactionUseCase } from './use-cases/get-transaction.usecase';
import { ListProductsUseCase } from './use-cases/list-products.usecase';
import { PayTransactionUseCase } from './use-cases/pay-transaction.usecase';
import { UpdateDeliveryUseCase } from './use-cases/update-delivery.usecase';

@Module({
  imports: [DatabaseModule, PaymentModule],
  providers: [
    ListProductsUseCase,
    GetProductUseCase,
    CreateTransactionUseCase,
    PayTransactionUseCase,
    GetTransactionUseCase,
    GetCustomerUseCase,
    GetDeliveryUseCase,
    UpdateDeliveryUseCase,
  ],
  exports: [
    ListProductsUseCase,
    GetProductUseCase,
    CreateTransactionUseCase,
    PayTransactionUseCase,
    GetTransactionUseCase,
    GetCustomerUseCase,
    GetDeliveryUseCase,
    UpdateDeliveryUseCase,
  ],
})
export class ApplicationModule {}
