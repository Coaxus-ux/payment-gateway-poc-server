import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ExpiryDate } from '@/presentation/validators/expiry.validator';
import { LuhnCheck } from '@/presentation/validators/luhn.validator';

export class PayTransactionDto {
  @IsString()
  @IsNotEmpty()
  @LuhnCheck()
  cardNumber!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  expMonth!: number;

  @IsInt()
  @Min(0)
  @ExpiryDate('expMonth', 'expYear')
  expYear!: number;

  @IsString()
  @IsNotEmpty()
  cvc!: string;

  @IsOptional()
  @IsString()
  holderName?: string;
}
