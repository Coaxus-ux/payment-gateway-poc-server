import { Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from '@/application/tokens';
import { PaymentGatewayProvider } from './payment-gateway.adapter';

@Module({
  providers: [{ provide: PAYMENT_PROVIDER, useClass: PaymentGatewayProvider }],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentModule {}
