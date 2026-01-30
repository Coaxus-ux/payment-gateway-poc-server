import { Result } from '@/shared/result';
import { ProductSnapshot } from '@/domain/product/product';
import { TransactionStatus } from './transaction-status';

export type TransactionItem = {
  productId: string;
  quantity: number;
  productSnapshot: ProductSnapshot;
};

export class Transaction {
  private constructor(
    readonly id: string,
    readonly customerId: string,
    readonly deliveryId: string,
    readonly amount: number,
    readonly currency: string,
    readonly items: TransactionItem[],
    readonly status: TransactionStatus,
    readonly providerRef: string | null,
    readonly failureReason: string | null,
  ) {}

  static create(props: {
    id: string;
    customerId: string;
    deliveryId: string;
    amount: number;
    currency: string;
    items: TransactionItem[];
  }) {
    if (!props.id || !props.customerId || !props.deliveryId) {
      return Result.err('TRANSACTION_INVALID');
    }
    if (!Number.isInteger(props.amount) || props.amount <= 0) {
      return Result.err('TRANSACTION_AMOUNT_INVALID');
    }
    if (!props.items || props.items.length === 0) {
      return Result.err('TRANSACTION_ITEMS_INVALID');
    }
    if (
      props.items.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      return Result.err('TRANSACTION_ITEMS_INVALID');
    }
    return Result.ok(
      new Transaction(
        props.id,
        props.customerId,
        props.deliveryId,
        props.amount,
        props.currency,
        props.items,
        TransactionStatus.PENDING,
        null,
        null,
      ),
    );
  }

  static restore(props: {
    id: string;
    customerId: string;
    deliveryId: string;
    amount: number;
    currency: string;
    items: TransactionItem[];
    status: TransactionStatus;
    providerRef: string | null;
    failureReason: string | null;
  }) {
    return new Transaction(
      props.id,
      props.customerId,
      props.deliveryId,
      props.amount,
      props.currency,
      props.items,
      props.status,
      props.providerRef,
      props.failureReason,
    );
  }

  markSuccess(providerRef: string) {
    if (this.status !== TransactionStatus.PENDING) {
      return Result.err('TRANSACTION_STATUS_INVALID');
    }
    return Result.ok(
      new Transaction(
        this.id,
        this.customerId,
        this.deliveryId,
        this.amount,
        this.currency,
        this.items,
        TransactionStatus.SUCCESS,
        providerRef,
        null,
      ),
    );
  }

  markFailed(reason: string, providerRef: string | null) {
    if (this.status !== TransactionStatus.PENDING) {
      return Result.err('TRANSACTION_STATUS_INVALID');
    }
    return Result.ok(
      new Transaction(
        this.id,
        this.customerId,
        this.deliveryId,
        this.amount,
        this.currency,
        this.items,
        TransactionStatus.FAILED,
        providerRef,
        reason,
      ),
    );
  }
}
