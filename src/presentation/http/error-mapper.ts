import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationError } from '@/application/errors';

export function mapErrorToHttp(error: ApplicationError): never {
  switch (error.type) {
    case 'PRODUCT_NOT_FOUND':
    case 'TRANSACTION_NOT_FOUND':
    case 'DELIVERY_NOT_FOUND':
    case 'CUSTOMER_NOT_FOUND':
      throw new NotFoundException({ error: error.type });
    case 'OUT_OF_STOCK':
      throw new ConflictException({ error: error.type });
    case 'DELIVERY_UPDATE_FORBIDDEN':
      throw new ForbiddenException({ error: error.type });
    case 'AMOUNT_MISMATCH':
      throw new BadRequestException({ error: error.type });
    case 'PAYMENT_FAILED':
      throw new BadRequestException({
        error: error.type,
        reason: error.reason,
      });
    case 'TRANSACTION_FINALIZED':
      throw new ConflictException({ error: error.type });
    default:
      throw new BadRequestException({ error: 'UNKNOWN_ERROR' });
  }
}
