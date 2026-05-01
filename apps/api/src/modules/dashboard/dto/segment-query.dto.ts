import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export enum SegmentType {
  LOCATION = 'location',
  SENIORITY = 'seniority',
  AGE_GROUP = 'age_group',
  GENDER = 'gender',
}

export class SegmentQueryDto {
  @IsEnum(SegmentType)
  @IsNotEmpty()
  type: SegmentType;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Period must be in YYYY-MM format',
  })
  period?: string;
}
