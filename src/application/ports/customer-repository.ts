import { Customer } from '../../domain/customer/customer';

export interface CustomerRepository {
  findByEmail(email: string): Promise<Customer | null>;
  findById(id: string): Promise<Customer | null>;
  create(customer: Customer): Promise<Customer>;
}
