export type ApplicationError =
  | { type: 'PRODUCT_NOT_FOUND' }
  | { type: 'OUT_OF_STOCK' }
  | { type: 'TRANSACTION_NOT_FOUND' }
  | { type: 'DELIVERY_NOT_FOUND' }
  | { type: 'DELIVERY_UPDATE_FORBIDDEN' }
  | { type: 'CUSTOMER_NOT_FOUND' }
  | { type: 'AMOUNT_MISMATCH' }
  | { type: 'ITEMS_INVALID' }
  | { type: 'PAYMENT_FAILED'; reason: string }
  | { type: 'TRANSACTION_FINALIZED' }
  | { type: 'ADMIN_UNAUTHORIZED' };
