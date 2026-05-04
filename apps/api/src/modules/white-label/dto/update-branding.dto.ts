import { IsString, IsOptional, Matches, Length } from 'class-validator';

export class UpdateBrandingDto {
  @IsString()
  @Length(1, 200)
  brand_name: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Renk #RRGGBB formatında olmalı.' })
  brand_color: string;
}
