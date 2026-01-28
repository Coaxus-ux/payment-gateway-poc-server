import { Customer } from '@/domain/customer/customer';
import { Delivery } from '@/domain/delivery/delivery';
import { Transaction } from '@/domain/transaction/transaction';

export interface CheckoutRepository {
  createPendingTransaction(input: {
    customer: Customer;
    delivery: Delivery;
    transaction: Transaction;
  }): Promise<Transaction>;
  updateDeliveryIfPending(input: {
    deliveryId: string;
    transactionId: string;
    delivery: Delivery;
  }): Promise<Delivery | null>;
}
