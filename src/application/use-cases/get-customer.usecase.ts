import { Inject, Injectable } from '@nestjs/common';
import { Customer } from '@/domain/customer/customer';
import { Result } from '@/shared/result';
import { ApplicationError } from '@/application/errors';
import { CustomerRepository } from '@/application/ports/customer-repository';
import { CUSTOMER_REPOSITORY } from '@/application/tokens';

@Injectable()
export class GetCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(input: { id?: string; email?: string }) {
    let customer: Customer | null = null;
    if (input.id) {
      customer = await this.customerRepository.findById(input.id);
    } else if (input.email) {
      customer = await this.customerRepository.findByEmail(input.email);
    }
    if (!customer) {
      return Result.err<ApplicationError>({ type: 'CUSTOMER_NOT_FOUND' });
    }
    return Result.ok<Customer>(customer);
  }
}
