import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/transaction/transaction';
import { Result } from '../../shared/result';
import { ApplicationError } from '../errors';
import { TransactionRepository } from '../ports/transaction-repository';
import { TRANSACTION_REPOSITORY } from '../tokens';

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(id: string) {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      return Result.err<ApplicationError>({ type: 'TRANSACTION_NOT_FOUND' });
    }
    return Result.ok<Transaction>(transaction);
  }
}
