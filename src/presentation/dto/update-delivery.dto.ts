import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateDeliveryDto {
  @IsUUID()
  transactionId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string | null;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string | null;
}
