import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ScoreService } from '../score/score.service';
import { ResponseService } from '../response/response.service';
import { ContentItem } from '../content/entities/content-item.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class EmployeeDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ContentItem)
    private readonly contentRepository: Repository<ContentItem>,
    private readonly scoreService: ScoreService,
    private readonly responseService: ResponseService,
  ) {}

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['company']
    });
    if (!user) throw new NotFoundException('User not found');

    // 1. Kişisel wellbeing kartı
    const personalScores = await this.scoreService.getPersonalScore(userId, ''); 

    // 2. Bekleyen anketler
    const pendingSurveys = await this.responseService.getPendingAccountMode(userId);

    // 3. Tamamlanan anket geçmişi
    const history = await this.responseService.getHistory(userId);

    // 4. İçerik önerileri (lowest 2 dimensions)
    const recommendations = [];
    if (personalScores) {
      const dimensions = ['physical', 'mental', 'social', 'financial', 'work']
        .map(dim => ({ dim, score: personalScores[dim] || 0 }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 2);

      for (const d of dimensions) {
        const items = await this.contentRepository.find({
          where: { 
            dimension: d.dim, 
            is_active: true,
            score_threshold: LessThanOrEqual(Math.round(d.score))
          },
          take: 3,
        });
        recommendations.push(...items);
      }
    }

    return {
      profile: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        language: user.language,
      },
      latest_score: personalScores,
      score_change: 0,
      company_name: user.company?.name || 'Wellbeing Metric',
      pending_surveys: pendingSurveys,
      history: history,
      content_recommendations: recommendations,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.full_name) user.full_name = dto.full_name;
    if (dto.language) user.language = dto.language;
    // Assuming these fields exist in User entity or a settings json
    // user.notification_settings = { ...user.notification_settings, ...dto };

    await this.userRepository.save(user);
    return { success: true };
  }
}
