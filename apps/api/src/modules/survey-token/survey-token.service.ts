import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyToken } from './entities/survey-token.entity';

@Injectable()
export class SurveyTokenService {
  constructor(
    @InjectRepository(SurveyToken)
    private readonly tokenRepository: Repository<SurveyToken>,
  ) {}

  async validateToken(tokenStr: string) {
    const tokenRecord = await this.tokenRepository.createQueryBuilder('st')
      .leftJoinAndSelect('st.survey', 's')
      .leftJoinAndSelect('s.questions', 'q')
      .leftJoinAndSelect('q.options', 'qo')
      .leftJoinAndSelect('q.rows', 'qr')
      .where('st.token = :token', { token: tokenStr })
      .orderBy('q.order_index', 'ASC')
      .addOrderBy('qo.order_index', 'ASC')
      .addOrderBy('qr.order_index', 'ASC')
      .getOne();

    if (!tokenRecord) {
      throw new NotFoundException({ code: 'SURVEY_TOKEN_INVALID', message: 'Geçersiz token.' });
    }

    if (tokenRecord.is_used) {
      throw new BadRequestException({ code: 'SURVEY_TOKEN_USED', message: 'Bu token daha önce kullanılmış.' });
    }

    if (tokenRecord.expires_at && tokenRecord.expires_at < new Date()) {
      throw new BadRequestException({ code: 'SURVEY_TOKEN_EXPIRED', message: 'Bu token süresi dolmuş.' });
    }

    if (!tokenRecord.survey || !tokenRecord.survey.is_active) {
       throw new BadRequestException({ code: 'SURVEY_NOT_ACTIVE', message: 'Bu anket şu anda aktif değil.' });
    }

    const companyResult = await this.tokenRepository.manager.query(
      `SELECT name, logo_url FROM companies WHERE id = $1`, 
      [tokenRecord.company_id]
    );

    return {
      token: tokenRecord,
      survey: tokenRecord.survey,
      company: companyResult[0] || { name: 'Wellbeing Platformu' },
    };
  }

  async createTokensFromCsv(companyId: string, assignment: any, recipients: any[]) {
    const tokens = recipients.map(r => this.tokenRepository.create({
      company_id: companyId,
      survey_id: assignment.survey_id,
      assignment_id: assignment.id,
      token: require('crypto').randomBytes(32).toString('hex'),
      email: r.email,
      full_name: r.full_name,
      language: r.language || 'tr',
      metadata: r.metadata || {},
      due_at: assignment.due_at, // CRITICAL: set from assignment
      expires_at: assignment.due_at,
    }));

    return this.tokenRepository.save(tokens);
  }

  async createTokensFromPreviousPeriod(companyId: string, assignment: any) {
    const prevTokens = await this.tokenRepository.createQueryBuilder('st')
      .select('DISTINCT email, full_name, language, metadata')
      .where('st.company_id = :companyId', { companyId })
      .getRawMany();

    const tokens = prevTokens.map(pt => this.tokenRepository.create({
      company_id: companyId,
      survey_id: assignment.survey_id,
      assignment_id: assignment.id,
      token: require('crypto').randomBytes(32).toString('hex'),
      email: pt.email,
      full_name: pt.full_name,
      language: pt.language,
      metadata: pt.metadata,
      due_at: assignment.due_at, // CRITICAL: set from assignment
      expires_at: assignment.due_at,
    }));

    return this.tokenRepository.save(tokens);
  }
}
