import { Result } from '@/shared/result';
import { TransactionStatus } from '@/domain/transaction/transaction-status';

export class Delivery {
  private constructor(
    readonly id: string,
    readonly addressLine1: string,
    readonly addressLine2: string | null,
    readonly city: string,
    readonly country: string,
    readonly postalCode: string | null,
  ) {}

  static create(props: {
    id: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    country: string;
    postalCode?: string | null;
  }) {
    if (!props.id || !props.addressLine1 || !props.city || !props.country) {
      return Result.err('DELIVERY_INVALID');
    }
    return Result.ok(
      new Delivery(
        props.id,
        props.addressLine1,
        props.addressLine2 ?? null,
        props.city,
        props.country,
        props.postalCode ?? null,
      ),
    );
  }

  update(
    next: Partial<{
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      country: string;
      postalCode: string | null;
    }>,
    transactionStatus: TransactionStatus,
  ) {
    if (transactionStatus !== TransactionStatus.PENDING) {
      return Result.err('DELIVERY_UPDATE_FORBIDDEN');
    }
    return Result.ok(
      new Delivery(
        this.id,
        next.addressLine1 ?? this.addressLine1,
        next.addressLine2 ?? this.addressLine2,
        next.city ?? this.city,
        next.country ?? this.country,
        next.postalCode ?? this.postalCode,
      ),
    );
  }
}
