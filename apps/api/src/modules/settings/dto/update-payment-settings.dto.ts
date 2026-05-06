import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentSettingsDto {
  @IsObject()
  @IsOptional()
  providers?: Record<string, {
    is_active?:      boolean;
    public_key?:     string;
    secret_key?:     string;
    webhook_secret?: string;
    api_key?:        string;
    merchant_id?:    string;
    merchant_key?:   string;
    merchant_salt?:  string;
    client_id?:      string;
    client_secret?:  string;
    base_url?:       string;
    mode?:           string;
  }>;

  @IsString()
  @IsOptional()
  default_provider?: string;

  @IsString()
  @IsOptional()
  default_currency?: string;
}
