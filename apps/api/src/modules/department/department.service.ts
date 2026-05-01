import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User } from '../user/entities/user.entity';
import { WellbeingScore } from '../score/entities/wellbeing-score.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WellbeingScore)
    private readonly scoreRepository: Repository<WellbeingScore>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId: string) {
    try {
      const departments = await this.departmentRepository.find({
        where: { company_id: companyId, is_active: true },
        order: { name: 'ASC' },
      });

      const departmentIds = departments.map(d => d.id);
      if (departmentIds.length === 0) return [];

      // Get user counts
      const userCounts = await this.userRepository
        .createQueryBuilder('user')
        .select('user.department_id', 'department_id')
        .addSelect('COUNT(user.id)', 'count')
        .where('user.department_id IN (:...ids)', { ids: departmentIds })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .groupBy('user.department_id')
        .getRawMany();

      const countMap = new Map(userCounts.map(uc => [uc.department_id, parseInt(uc.count)]));

      // Get latest wellbeing scores
      const latestScores = await this.scoreRepository
        .createQueryBuilder('score')
        .where('score.segment_type = :type', { type: 'department' })
        .andWhere('score.segment_value IN (:...ids)', { ids: departmentIds })
        .andWhere('score.company_id = :companyId', { companyId })
        .orderBy('score.period', 'DESC')
        .getMany();

      const scoreMap = new Map();
      latestScores.forEach(s => {
        if (!scoreMap.has(s.segment_value)) {
          scoreMap.set(s.segment_value, s.score);
        }
      });

      return departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        user_count: countMap.get(dept.id) || 0,
        last_score: scoreMap.get(dept.id) || null,
      }));
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const department = await this.departmentRepository.findOne({
        where: { id, company_id: companyId, is_active: true },
      });

      if (!department) {
        throw new NotFoundException('Departman bulunamadı.');
      }

      const users = await this.userRepository.find({
        where: { department_id: id, company_id: companyId, is_active: true },
        select: ['id', 'full_name', 'email', 'position'],
      });

      return {
        ...department,
        users,
      };
    } catch (error) {
      throw error;
    }
  }

  async create(companyId: string, dto: CreateDepartmentDto, userId: string) {
    try {
      const existing = await this.departmentRepository.findOne({
        where: { company_id: companyId, name: dto.name, is_active: true },
      });

      if (existing) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Bu isimde bir departman zaten mevcut.',
        });
      }

      const department = this.departmentRepository.create({
        ...dto,
        company_id: companyId,
      });

      const saved = await this.departmentRepository.save(department);

      await this.auditService.logAction(
        userId,
        companyId,
        'department.create',
        'department',
        saved.id,
        { name: dto.name },
      );

      return saved;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, companyId: string, dto: UpdateDepartmentDto, userId: string) {
    try {
      const department = await this.departmentRepository.findOne({
        where: { id, company_id: companyId, is_active: true },
      });

      if (!department) {
        throw new NotFoundException('Departman bulunamadı.');
      }

      if (dto.name && dto.name !== department.name) {
        const existing = await this.departmentRepository.findOne({
          where: { company_id: companyId, name: dto.name, is_active: true },
        });

        if (existing) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'Bu isimde bir departman zaten mevcut.',
          });
        }
      }

      const oldName = department.name;
      department.name = dto.name;
      const updated = await this.departmentRepository.save(department);

      await this.auditService.logAction(
        userId,
        companyId,
        'department.update',
        'department',
        id,
        { old_name: oldName, new_name: dto.name },
      );

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string, companyId: string, userId: string) {
    try {
      const department = await this.departmentRepository.findOne({
        where: { id, company_id: companyId, is_active: true },
      });

      if (!department) {
        throw new NotFoundException('Departman bulunamadı.');
      }

      const activeUsers = await this.userRepository.count({
        where: { department_id: id, is_active: true },
      });

      if (activeUsers > 0) {
        throw new BadRequestException({
          code: 'DEPARTMENT_HAS_USERS',
          message: 'Departmana bağlı aktif çalışanlar olduğu için silinemez. Önce çalışanları taşıyın.',
        });
      }

      department.is_active = false;
      await this.departmentRepository.save(department);

      await this.auditService.logAction(
        userId,
        companyId,
        'department.delete',
        'department',
        id,
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async moveUsers(departmentId: string, targetDepartmentId: string, companyId: string, userId: string) {
    try {
      const [sourceDept, targetDept] = await Promise.all([
        this.departmentRepository.findOne({ where: { id: departmentId, company_id: companyId, is_active: true } }),
        this.departmentRepository.findOne({ where: { id: targetDepartmentId, company_id: companyId, is_active: true } }),
      ]);

      if (!sourceDept || !targetDept) {
        throw new NotFoundException('Kaynak veya hedef departman bulunamadı.');
      }

      await this.userRepository.update(
        { department_id: departmentId, company_id: companyId },
        { department_id: targetDepartmentId },
      );

      await this.auditService.logAction(
        userId,
        companyId,
        'department.move_users',
        'department',
        departmentId,
        { target_department_id: targetDepartmentId },
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}
