import { Result } from '@/shared/result';
import { ProductSnapshot } from '@/domain/product/product';
import { TransactionStatus } from './transaction-status';

export class Transaction {
  private constructor(
    readonly id: string,
    readonly productId: string,
    readonly customerId: string,
    readonly deliveryId: string,
    readonly amount: number,
    readonly currency: string,
    readonly productSnapshot: ProductSnapshot,
    readonly status: TransactionStatus,
    readonly providerRef: string | null,
    readonly failureReason: string | null,
  ) {}

  static create(props: {
    id: string;
    productId: string;
    customerId: string;
    deliveryId: string;
    amount: number;
    currency: string;
    productSnapshot: ProductSnapshot;
  }) {
    if (
      !props.id ||
      !props.productId ||
      !props.customerId ||
      !props.deliveryId
    ) {
      return Result.err('TRANSACTION_INVALID');
    }
    if (!Number.isInteger(props.amount) || props.amount <= 0) {
      return Result.err('TRANSACTION_AMOUNT_INVALID');
    }
    return Result.ok(
      new Transaction(
        props.id,
        props.productId,
        props.customerId,
        props.deliveryId,
        props.amount,
        props.currency,
        props.productSnapshot,
        TransactionStatus.PENDING,
        null,
        null,
      ),
    );
  }

  static restore(props: {
    id: string;
    productId: string;
    customerId: string;
    deliveryId: string;
    amount: number;
    currency: string;
    productSnapshot: ProductSnapshot;
    status: TransactionStatus;
    providerRef: string | null;
    failureReason: string | null;
  }) {
    return new Transaction(
      props.id,
      props.productId,
      props.customerId,
      props.deliveryId,
      props.amount,
      props.currency,
      props.productSnapshot,
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
        this.productId,
        this.customerId,
        this.deliveryId,
        this.amount,
        this.currency,
        this.productSnapshot,
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
        this.productId,
        this.customerId,
        this.deliveryId,
        this.amount,
        this.currency,
        this.productSnapshot,
        TransactionStatus.FAILED,
        providerRef,
        reason,
      ),
    );
  }
}
