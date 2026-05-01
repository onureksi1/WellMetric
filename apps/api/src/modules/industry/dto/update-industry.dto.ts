import { PartialType } from '@nestjs/mapped-types';
import { CreateIndustryDto } from './create-industry.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateIndustryDto extends PartialType(CreateIndustryDto) {
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
