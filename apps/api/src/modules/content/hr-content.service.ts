import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentAssignment } from './entities/content-assignment.entity';
import { User } from '../user/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class HrContentService {
  constructor(
    @InjectRepository(ContentAssignment)
    private readonly assignmentRepo: Repository<ContentAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly logger: AppLogger,
  ) {}

  async findAssignments(companyId: string) {
    return this.assignmentRepo.find({
      where: { company_id: companyId, status: 'sent' },
      relations: ['content_item', 'consultant'],
      order: { sent_at: 'DESC' },
    });
  }

  async notifyEmployees(assignmentId: string, hrUserId: string, companyId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, company_id: companyId },
      relations: ['content_item', 'company', 'consultant', 'department'],
    });

    if (!assignment) throw new NotFoundException('İçerik ataması bulunamadı');
    if (assignment.status !== 'sent') throw new ForbiddenException('Bu içerik henüz onaylanmamış');

    // Alıcıları belirle
    const recipientQuery: any = {
      company_id: companyId,
      is_active:  true,
    };
    if (assignment.department_id) {
      recipientQuery.department_id = assignment.department_id;
    }

    const employees = await this.userRepo.find({ where: recipientQuery });

    if (employees.length === 0) {
      this.logger.warn('Gönderilecek çalışan bulunamadı', { service: 'HrContentService', method: 'notifyEmployees', companyId }, { assignmentId });
      return { success: false, message: 'Gönderilecek aktif çalışan bulunamadı' };
    }

    // Mail gönderimi
    for (const employee of employees) {
      await this.notificationService.sendEmail(employee.email, 'content_shared_to_employees', {
        employee_name:    employee.full_name,
        company_name:     assignment.company.name,
        content_title:    assignment.content_item.title_tr,
        content_type:     assignment.content_item.type,
        content_url:      assignment.content_item.url_tr,
        consultant_name:  assignment.consultant.full_name,
        notes:            assignment.notes || '',
        platform_url:     process.env.APP_URL || 'http://localhost:3000',
      });
    }

    // Atamayı güncelle
    await this.assignmentRepo.update(assignmentId, {
      notified_at: new Date(),
      notified_by: hrUserId,
    });

    this.logger.info('İçerik çalışanlara duyuruldu', { 
      service: 'HrContentService',
      method: 'notifyEmployees',
      companyId,
      userId: hrUserId 
    }, { 
      assignmentId, 
      recipientCount: employees.length 
    });

    return { success: true, count: employees.length };
  }
}
