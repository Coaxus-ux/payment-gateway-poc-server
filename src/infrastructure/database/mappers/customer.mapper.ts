import { Customer } from '../../../domain/customer/customer';
import { CustomerEntity } from '../entities/customer.entity';

export const CustomerMapper = {
  toDomain(entity: CustomerEntity): Customer {
    const customerResult = Customer.create({
      id: entity.id,
      email: entity.email,
      fullName: entity.fullName,
      phone: entity.phone,
    });
    if (!customerResult.ok) {
      throw new Error('Invalid customer entity');
    }
    return customerResult.value;
  },
  toEntity(domain: Customer): CustomerEntity {
    const entity = new CustomerEntity();
    entity.id = domain.id;
    entity.email = domain.email;
    entity.fullName = domain.fullName;
    entity.phone = domain.phone;
    return entity;
  },
};
