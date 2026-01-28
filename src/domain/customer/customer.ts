import { Result } from '@/shared/result';

export class Customer {
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly fullName: string,
    readonly phone: string | null,
  ) {}

  static create(props: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
  }) {
    if (!props.id || !props.email || !props.fullName) {
      return Result.err('CUSTOMER_INVALID');
    }
    return Result.ok(
      new Customer(
        props.id,
        props.email.toLowerCase(),
        props.fullName,
        props.phone ?? null,
      ),
    );
  }
}
