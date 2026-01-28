import { Inject, Injectable } from '@nestjs/common';
import { Delivery } from '@/domain/delivery/delivery';
import { Result } from '@/shared/result';
import { ApplicationError } from '@/application/errors';
import { CheckoutRepository } from '@/application/ports/checkout-repository';
import { DeliveryRepository } from '@/application/ports/delivery-repository';
import { TransactionRepository } from '@/application/ports/transaction-repository';
import {
  CHECKOUT_REPOSITORY,
  DELIVERY_REPOSITORY,
  TRANSACTION_REPOSITORY,
} from '@/application/tokens';

export type UpdateDeliveryInput = {
  transactionId: string;
  deliveryId: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  country?: string;
  postalCode?: string | null;
};

@Injectable()
export class UpdateDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(CHECKOUT_REPOSITORY)
    private readonly checkoutRepository: CheckoutRepository,
  ) {}

  async execute(input: UpdateDeliveryInput) {
    const transaction = await this.transactionRepository.findById(
      input.transactionId,
    );
    if (!transaction) {
      return Result.err<ApplicationError>({ type: 'TRANSACTION_NOT_FOUND' });
    }

    const delivery = await this.deliveryRepository.findById(input.deliveryId);
    if (!delivery) {
      return Result.err<ApplicationError>({ type: 'DELIVERY_NOT_FOUND' });
    }

    const updated = delivery.update(
      {
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        country: input.country,
        postalCode: input.postalCode,
      },
      transaction.status,
    );
    if (!updated.ok) {
      return Result.err<ApplicationError>({
        type: 'DELIVERY_UPDATE_FORBIDDEN',
      });
    }

    const saved = await this.checkoutRepository.updateDeliveryIfPending({
      deliveryId: input.deliveryId,
      transactionId: input.transactionId,
      delivery: updated.value,
    });
    if (!saved) {
      return Result.err<ApplicationError>({
        type: 'DELIVERY_UPDATE_FORBIDDEN',
      });
    }

    return Result.ok<Delivery>(saved);
  }
}
