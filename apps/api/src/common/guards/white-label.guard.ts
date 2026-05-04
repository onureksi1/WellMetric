import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultantPlan } from '../../modules/consultant/entities/consultant-plan.entity';

@Injectable()
export class WhiteLabelGuard implements CanActivate {
  constructor(
    @InjectRepository(ConsultantPlan)
    private readonly planRepo: Repository<ConsultantPlan>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('USER_NOT_FOUND');
    }

    const plan = await this.planRepo.findOne({
      where: { consultant_id: user.id, is_active: true },
    });

    if (!plan?.white_label) {
      throw new ForbiddenException({
        code: 'WHITE_LABEL_NOT_AVAILABLE',
        message: 'White-label özelliği Enterprise plana özeldir.',
      });
    }

    return true;
  }
}
