import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerRepository } from '../../../application/ports/customer-repository';
import { Customer } from '../../../domain/customer/customer';
import { CustomerEntity } from '../entities/customer.entity';
import { CustomerMapper } from '../mappers/customer.mapper';

@Injectable()
export class CustomerRepositoryTypeOrm implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repo: Repository<CustomerEntity>,
  ) {}

  async findByEmail(email: string): Promise<Customer | null> {
    const entity = await this.repo.findOne({
      where: { email: email.toLowerCase() },
    });
    return entity ? CustomerMapper.toDomain(entity) : null;
  }

  async findById(id: string): Promise<Customer | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? CustomerMapper.toDomain(entity) : null;
  }

  async create(customer: Customer): Promise<Customer> {
    const entity = this.repo.create(CustomerMapper.toEntity(customer));
    const saved = await this.repo.save(entity);
    return CustomerMapper.toDomain(saved);
  }
}
