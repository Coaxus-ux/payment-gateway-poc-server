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
  productId?: string;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
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
    const rawItems =
      input.items && input.items.length > 0
        ? input.items
        : input.productId
          ? [{ productId: input.productId, quantity: 1 }]
          : null;

    if (!rawItems) {
      return Result.err<ApplicationError>({ type: 'ITEMS_INVALID' });
    }

    const itemOrder: string[] = [];
    const itemQuantityMap = new Map<string, number>();
    for (const item of rawItems) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return Result.err<ApplicationError>({ type: 'ITEMS_INVALID' });
      }
      if (!itemQuantityMap.has(item.productId)) {
        itemOrder.push(item.productId);
        itemQuantityMap.set(item.productId, 0);
      }
      itemQuantityMap.set(
        item.productId,
        (itemQuantityMap.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const products = await Promise.all(
      itemOrder.map((productId) => this.productRepository.findById(productId)),
    );

    const productMap = new Map<string, NonNullable<typeof products[number]>>();
    products.forEach((product, idx) => {
      const productId = itemOrder[idx];
      if (product) {
        productMap.set(productId, product);
      }
    });

    for (const productId of itemOrder) {
      const product = productMap.get(productId);
      if (!product) {
        return Result.err<ApplicationError>({ type: 'PRODUCT_NOT_FOUND' });
      }
      const quantity = itemQuantityMap.get(productId) ?? 0;
      if (!product.stock.canDecrement(quantity)) {
        return Result.err<ApplicationError>({ type: 'OUT_OF_STOCK' });
      }
      if (product.currency !== input.currency) {
        return Result.err<ApplicationError>({ type: 'AMOUNT_MISMATCH' });
      }
    }

    let computedTotal = 0;
    const items = itemOrder.map((productId) => {
      const product = productMap.get(productId);
      if (!product) {
        throw new Error('Missing product during transaction build');
      }
      const quantity = itemQuantityMap.get(productId) ?? 0;
      computedTotal += product.priceAmount * quantity;
      return {
        productId: product.id,
        quantity,
        productSnapshot: product.snapshot(),
      };
    });

    if (computedTotal !== input.amount) {
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
      customerId: customerResult.value.id,
      deliveryId: deliveryResult.value.id,
      amount: input.amount,
      currency: input.currency,
      items,
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
