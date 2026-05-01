import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum UserSeniority {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
}

export enum UserAgeGroup {
  G18_25 = '18-25',
  G26_35 = '26-35',
  G36_45 = '36-45',
  G46_PLUS = '46+',
}

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT = 'prefer_not',
}

export enum UserLanguage {
  TR = 'tr',
  EN = 'en',
}

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsUUID()
  @IsNotEmpty()
  department_id: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(UserSeniority)
  @IsOptional()
  seniority?: UserSeniority;

  @IsEnum(UserAgeGroup)
  @IsOptional()
  age_group?: UserAgeGroup;

  @IsEnum(UserGender)
  @IsOptional()
  gender?: UserGender;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsEnum(UserLanguage)
  @IsOptional()
  language?: UserLanguage = UserLanguage.TR;
}
