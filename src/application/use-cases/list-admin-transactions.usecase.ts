import { Inject, Injectable } from '@nestjs/common';
import { ApplicationError } from '@/application/errors';
import { AdminUserRepository } from '@/application/ports/admin-user-repository';
import { TransactionRepository } from '@/application/ports/transaction-repository';
import { ADMIN_USER_REPOSITORY, TRANSACTION_REPOSITORY } from '@/application/tokens';
import { Result } from '@/shared/result';

@Injectable()
export class ListAdminTransactionsUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminRepository: AdminUserRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: { adminEmail?: string; limit?: number; offset?: number }) {
    if (!input.adminEmail) {
      return Result.err<ApplicationError>({ type: 'ADMIN_UNAUTHORIZED' });
    }
    const admin = await this.adminRepository.findByEmail(input.adminEmail);
    if (!admin) {
      return Result.err<ApplicationError>({ type: 'ADMIN_UNAUTHORIZED' });
    }
    const data = await this.transactionRepository.listAll({
      limit: input.limit,
      offset: input.offset,
    });
    return Result.ok(data);
  }
}
