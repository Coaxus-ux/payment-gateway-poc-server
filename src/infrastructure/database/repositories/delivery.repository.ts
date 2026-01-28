import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryRepository } from '@/application/ports/delivery-repository';
import { Delivery } from '@/domain/delivery/delivery';
import { DeliveryEntity } from '@/infrastructure/database/entities/delivery.entity';
import { DeliveryMapper } from '@/infrastructure/database/mappers/delivery.mapper';

@Injectable()
export class DeliveryRepositoryTypeOrm implements DeliveryRepository {
  constructor(
    @InjectRepository(DeliveryEntity)
    private readonly repo: Repository<DeliveryEntity>,
  ) {}

  async findById(id: string): Promise<Delivery | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? DeliveryMapper.toDomain(entity) : null;
  }

  async create(delivery: Delivery): Promise<Delivery> {
    const entity = this.repo.create(DeliveryMapper.toEntity(delivery));
    const saved = await this.repo.save(entity);
    return DeliveryMapper.toDomain(saved);
  }

  async update(delivery: Delivery): Promise<Delivery> {
    const entity = this.repo.create(DeliveryMapper.toEntity(delivery));
    const saved = await this.repo.save(entity);
    return DeliveryMapper.toDomain(saved);
  }
}
