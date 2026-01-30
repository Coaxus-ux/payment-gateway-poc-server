import { Transaction } from '@/domain/transaction/transaction';

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  create(transaction: Transaction): Promise<Transaction>;
  markFailedIfPending(input: {
    id: string;
    reason: string;
    providerRef: string | null;
    cardLast4: string | null;
  }): Promise<Transaction | null>;
  markSuccessAndDecrementStock(input: {
    id: string;
    providerRef: string;
    cardLast4: string | null;
  }): Promise<{
    transaction: Transaction | null;
    stockAdjusted: boolean;
    outcome: 'SUCCESS' | 'ALREADY_FINAL' | 'INSUFFICIENT_STOCK' | 'NOT_FOUND';
  }>;
}
