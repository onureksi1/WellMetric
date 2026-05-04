import { PartialType } from '@nestjs/mapped-types';
import { CreateConsultantSurveyDto } from './create-consultant-survey.dto';

export class UpdateConsultantSurveyDto extends PartialType(CreateConsultantSurveyDto) {}
