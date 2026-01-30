import { Inject, Injectable } from '@nestjs/common';
import { ApplicationError } from '@/application/errors';
import { CustomerRepository } from '@/application/ports/customer-repository';
import { TransactionRepository } from '@/application/ports/transaction-repository';
import { CUSTOMER_REPOSITORY, TRANSACTION_REPOSITORY } from '@/application/tokens';
import { Result } from '@/shared/result';

@Injectable()
export class GetCustomerProfileUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: { email?: string }) {
    if (!input.email) {
      return Result.err<ApplicationError>({ type: 'CUSTOMER_NOT_FOUND' });
    }

    const customer = await this.customerRepository.findByEmail(input.email);
    if (!customer) {
      return Result.err<ApplicationError>({ type: 'CUSTOMER_NOT_FOUND' });
    }

    const latest = await this.transactionRepository.findLatestByCustomerId(
      customer.id,
    );

    return Result.ok({
      customer,
      delivery: latest?.delivery ?? null,
      lastTransactionId: latest?.transactionId ?? null,
    });
  }
}
