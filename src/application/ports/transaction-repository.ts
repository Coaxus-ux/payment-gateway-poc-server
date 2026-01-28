import { Transaction } from '../../domain/transaction/transaction';

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  create(transaction: Transaction): Promise<Transaction>;
  markFailedIfPending(input: {
    id: string;
    reason: string;
    providerRef: string | null;
  }): Promise<Transaction | null>;
  markSuccessAndDecrementStock(input: {
    id: string;
    providerRef: string;
    quantity: number;
  }): Promise<{
    transaction: Transaction | null;
    stockAdjusted: boolean;
  }>;
}
