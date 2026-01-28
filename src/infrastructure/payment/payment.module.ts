import { Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from '../../application/tokens';
import { WompiPaymentProvider } from './wompi.adapter';

@Module({
  providers: [{ provide: PAYMENT_PROVIDER, useClass: WompiPaymentProvider }],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentModule {}
