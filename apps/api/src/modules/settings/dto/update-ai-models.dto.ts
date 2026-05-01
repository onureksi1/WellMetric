import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AiModelDef {
  @IsString()
  provider: string;

  @IsString()
  model: string;
}

export class UpdateAiModelsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AiModelDef)
  open_text_summary?: AiModelDef;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiModelDef)
  risk_alert?: AiModelDef;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiModelDef)
  action_suggestion?: AiModelDef;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiModelDef)
  trend_analysis?: AiModelDef;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiModelDef)
  hr_chat?: AiModelDef;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiModelDef)
  admin_anomaly?: AiModelDef;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiModelDef)
  admin_chat?: AiModelDef;
}
