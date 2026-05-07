import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InAppNotification } from './entities/in-app-notification.entity';

@Injectable()
export class InAppNotificationService {
  private readonly logger = new Logger(InAppNotificationService.name);

  constructor(
    @InjectRepository(InAppNotification)
    private readonly repo: Repository<InAppNotification>,
  ) {}

  // ── Bildirim oluştur ────────────────────────────────────────
  async create(params: {
    userId:   string;
    type:     string;
    titleTr:  string;
    titleEn:  string;
    bodyTr?:  string;
    bodyEn?:  string;
    link?:    string;
    metadata?: Record<string, any>;
  }): Promise<InAppNotification> {
    const notif = this.repo.create({
      userId:    params.userId,
      type:      params.type,
      titleTr:   params.titleTr,
      titleEn:   params.titleEn,
      bodyTr:    params.bodyTr,
      bodyEn:    params.bodyEn,
      link:      params.link,
      metadata:  params.metadata ?? {},
      isRead:    false,
      createdAt: new Date(),
    });
    return this.repo.save(notif);
  }

  // ── Kullanıcının bildirimlerini getir ───────────────────────
  async findByUser(userId: string, limit = 20) {
    return this.repo.find({
      where:  { userId },
      order:  { createdAt: 'DESC' },
      take:   limit,
    });
  }

  // ── Okunmamış sayısı ────────────────────────────────────────
  async countUnread(userId: string): Promise<number> {
    return this.repo.count({
      where: { userId, isRead: false }
    });
  }

  // ── Okundu işaretle ─────────────────────────────────────────
  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.update(
      { id, userId },
      { isRead: true, readAt: new Date() }
    );
  }

  // ── Tümünü okundu işaretle ──────────────────────────────────
  async markAllRead(userId: string): Promise<void> {
    await this.repo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  // ── Sil ─────────────────────────────────────────────────────
  async delete(id: string, userId: string): Promise<void> {
    await this.repo.delete({ id, userId });
  }

  // ── Eski bildirimleri temizle (30 günden eski) ───────────────
  async cleanup(): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .delete()
      .where('created_at < NOW() - INTERVAL \'30 days\'')
      .andWhere('is_read = true')
      .execute();
  }

  // ── Yardımcı: Çoklu kullanıcıya bildirim gönder ─────────────
  async createForUsers(
    userIds: string[],
    params: Omit<{
      userId:   string;
      type:     string;
      titleTr:  string;
      titleEn:  string;
      bodyTr?:  string;
      bodyEn?:  string;
      link?:    string;
      metadata?: Record<string, any>;
    }, 'userId'>
  ): Promise<void> {
    for (const userId of userIds) {
      await this.create({ ...params, userId });
    }
  }
}
