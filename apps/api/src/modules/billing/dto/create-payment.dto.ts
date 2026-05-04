import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  provider: 'stripe' | 'iyzico' | 'paytr';

  @IsString()
  package_key: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsObject()
  payment_card?: {
    cardHolderName: string;
    cardNumber:     string;
    expireMonth:    string;
    expireYear:     string;
    cvc:            string;
  };

  @IsString()
  @IsOptional()
  identity_number?: string;

  @IsString()
  @IsOptional()
  billing_address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  ip?: string;
}
