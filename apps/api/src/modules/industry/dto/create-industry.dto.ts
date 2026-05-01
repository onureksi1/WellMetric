import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIndustryDto {
  @IsString()
  @IsNotEmpty({ message: 'Türkçe etiket zorunludur.' })
  @MinLength(2, { message: 'Türkçe etiket en az 2 karakter olmalıdır.' })
  @MaxLength(200, { message: 'Türkçe etiket en fazla 200 karakter olabilir.' })
  label_tr: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'İngilizce etiket en fazla 200 karakter olabilir.' })
  label_en?: string;

  @IsNumber()
  @IsOptional()
  order_index?: number;
}
