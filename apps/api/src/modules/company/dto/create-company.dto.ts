import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { INDUSTRIES, IndustryValue } from '@wellanalytics/shared';

export enum CompanyPlan {
  STARTER = 'starter',
  GROWTH = 'growth',
  ENTERPRISE = 'enterprise',
  CORPORATE = 'corporate',
}

export enum SizeBand {
  BAND_1_50 = '1-50',
  BAND_51_200 = '51-200',
  BAND_201_500 = '201-500',
  BAND_501_PLUS = '501+',
}

export enum DefaultLanguage {
  TR = 'tr',
  EN = 'en',
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty({ message: 'Firma adı zorunludur.' })
  @MinLength(2, { message: 'Firma adı en az 2 karakter olmalıdır.' })
  @MaxLength(200, { message: 'Firma adı en fazla 200 karakter olabilir.' })
  name: string;

  @IsEnum(CompanyPlan, { message: 'Geçersiz plan tipi.' })
  @IsNotEmpty({ message: 'Plan zorunludur.' })
  plan: CompanyPlan;

  @IsEmail({}, { message: 'Geçerli bir iletişim emaili giriniz.' })
  @IsNotEmpty({ message: 'İletişim emaili zorunludur.' })
  contact_email: string;

  @IsEmail({}, { message: 'Geçerli bir HR yetkili emaili giriniz.' })
  @IsNotEmpty({ message: 'HR yetkili emaili zorunludur.' })
  hr_admin_email: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsEnum(SizeBand, { message: 'Geçersiz çalışan sayısı aralığı.' })
  @IsOptional()
  size_band?: SizeBand;

  @IsEnum(DefaultLanguage, { message: 'Geçersiz dil seçeneği.' })
  @IsOptional()
  default_language?: DefaultLanguage = DefaultLanguage.TR;

  @IsString()
  @IsOptional()
  hr_admin_full_name?: string;

  @IsUUID('4', { message: 'Geçersiz danışman ID.' })
  @IsOptional()
  consultant_id?: string;
}
