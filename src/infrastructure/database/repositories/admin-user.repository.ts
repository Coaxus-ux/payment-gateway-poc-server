import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserRepository } from '@/application/ports/admin-user-repository';
import { AdminUserEntity } from '@/infrastructure/database/entities/admin-user.entity';

@Injectable()
export class AdminUserRepositoryTypeOrm implements AdminUserRepository {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly repo: Repository<AdminUserEntity>,
  ) {}

  async findByEmail(email: string) {
    const entity = await this.repo.findOne({ where: { email } });
    if (!entity) return null;
    return {
      id: entity.id,
      email: entity.email,
      fullName: entity.fullName,
      role: entity.role,
    };
  }
}
