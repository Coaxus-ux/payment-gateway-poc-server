import { Transaction } from '@/domain/transaction/transaction';

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  create(transaction: Transaction): Promise<Transaction>;
  listAll(input?: { limit?: number; offset?: number }): Promise<{
    total: number;
    items: Array<{
      id: string;
      status: string;
      amount: number;
      currency: string;
      createdAt: Date;
      customer: {
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
      };
      delivery: {
        id: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        country: string;
        postalCode: string | null;
      };
      items: Array<{
        id: string;
        productId: string;
        quantity: number;
        unitPriceAmount: number;
        currency: string;
        productSnapshot: {
          id: string;
          name: string;
          description: string | null;
          imageUrls: string[];
          priceAmount: number;
          currency: string;
        };
      }>;
    }>;
  }>;
  findLatestByCustomerId(customerId: string): Promise<{
    transactionId: string;
    delivery: {
      id: string;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      country: string;
      postalCode: string | null;
    };
  } | null>;
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
