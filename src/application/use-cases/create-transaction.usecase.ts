import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Customer } from '@/domain/customer/customer';
import { Delivery } from '@/domain/delivery/delivery';
import { Transaction } from '@/domain/transaction/transaction';
import { Result } from '@/shared/result';
import { ApplicationError } from '@/application/errors';
import { CheckoutRepository } from '@/application/ports/checkout-repository';
import { ProductRepository } from '@/application/ports/product-repository';
import { CHECKOUT_REPOSITORY, PRODUCT_REPOSITORY } from '@/application/tokens';

export type CreateTransactionInput = {
  productId: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    fullName: string;
    phone?: string | null;
  };
  delivery: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    country: string;
    postalCode?: string | null;
  };
};

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(CHECKOUT_REPOSITORY)
    private readonly checkoutRepository: CheckoutRepository,
  ) {}

  async execute(input: CreateTransactionInput) {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      return Result.err<ApplicationError>({ type: 'PRODUCT_NOT_FOUND' });
    }
    if (!product.stock.canDecrement(1)) {
      return Result.err<ApplicationError>({ type: 'OUT_OF_STOCK' });
    }
    if (
      product.priceAmount !== input.amount ||
      product.currency !== input.currency
    ) {
      return Result.err<ApplicationError>({ type: 'AMOUNT_MISMATCH' });
    }

    const customerResult = Customer.create({
      id: randomUUID(),
      email: input.customer.email,
      fullName: input.customer.fullName,
      phone: input.customer.phone,
    });
    if (!customerResult.ok) {
      return Result.err<ApplicationError>({ type: 'CUSTOMER_NOT_FOUND' });
    }

    const deliveryResult = Delivery.create({
      id: randomUUID(),
      addressLine1: input.delivery.addressLine1,
      addressLine2: input.delivery.addressLine2,
      city: input.delivery.city,
      country: input.delivery.country,
      postalCode: input.delivery.postalCode,
    });
    if (!deliveryResult.ok) {
      return Result.err<ApplicationError>({ type: 'DELIVERY_NOT_FOUND' });
    }

    const transactionResult = Transaction.create({
      id: randomUUID(),
      productId: product.id,
      customerId: customerResult.value.id,
      deliveryId: deliveryResult.value.id,
      amount: input.amount,
      currency: input.currency,
      productSnapshot: product.snapshot(),
    });
    if (!transactionResult.ok) {
      return Result.err<ApplicationError>({ type: 'TRANSACTION_NOT_FOUND' });
    }

    const transaction = await this.checkoutRepository.createPendingTransaction({
      customer: customerResult.value,
      delivery: deliveryResult.value,
      transaction: transactionResult.value,
    });

    return Result.ok(transaction);
  }
}
