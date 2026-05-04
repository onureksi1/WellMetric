import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../../modules/survey/entities/survey.entity';

@Injectable()
export class ConsultantSurveyOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const surveyId = request.params.id;

    if (!surveyId) return true; // POST (create) — id yok, geç

    const survey = await this.surveyRepo.findOne({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new NotFoundException('Anket bulunamadı');
    }

    // Global admin anketi — dokunulamaz
    if (survey.company_id === null) {
      throw new ForbiddenException('SURVEY_NOT_OWNED');
    }

    // Başka consultant'ın anketi — dokunulamaz
    if (survey.created_by !== user.id) {
      throw new ForbiddenException('SURVEY_NOT_OWNED');
    }

    return true;
  }
}
