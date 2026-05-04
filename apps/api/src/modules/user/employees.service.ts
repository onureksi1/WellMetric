import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Department } from '../department/entities/department.entity';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilterDto } from './dto/employee.dto';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {}

  // ── Tekli ekleme ─────────────────────────────────────────────────
  async create(dto: CreateEmployeeDto, companyId: string): Promise<Employee> {
    console.log('[EmployeesService.create] çağrıldı', {
      companyId,
      dto,
    });

    try {
      if (dto.department_id) {
        const dept = await this.deptRepo.findOne({
          where: { id: dto.department_id, company_id: companyId }
        });
        if (!dept) throw new BadRequestException('Departman bu firmaya ait değil');
      }

      const normalizedEmail = dto.email.trim().toLowerCase();
      const existing = await this.employeeRepo.findOne({
        where: { companyId: companyId, email: normalizedEmail }
      });

      if (existing) {
        if (!existing.isActive) {
          await this.employeeRepo.update(existing.id, { isActive: true, ...dto });
          this.logger.info('Pasif çalışan reaktive edildi', { service: 'EmployeesService' },
            { email: dto.email });
          return this.employeeRepo.findOne({ where: { id: existing.id } });
        }
        throw new ConflictException('Bu e-posta zaten kayıtlı');
      }

      const employee = this.employeeRepo.create({
        fullName:     dto.full_name.trim(),
        email:        normalizedEmail,
        departmentId: dto.department_id,
        position:     dto.position,
        startDate:    dto.start_date ? new Date(dto.start_date) : undefined,
        companyId,
      });

      console.log('[EmployeesService.create] entity oluşturuldu', employee);

      const saved = await this.employeeRepo.save(employee);
      
      console.log('[EmployeesService.create] kaydedildi', { id: saved.id });
      
      this.logger.info('Çalışan eklendi', { service: 'EmployeesService' }, { id: saved.id });
      return saved;

    } catch (err) {
      console.error('[EmployeesService.create] HATA', {
        message: err.message,
        stack:   err.stack,
        dto,
      });
      throw err;
    }
  }

  // ── CSV toplu yükleme ─────────────────────────────────────────────
  async bulkImport(
    file: Express.Multer.File,
    companyId: string,
  ): Promise<{ success_count: number; error_count: number; errors: Array<{ row: number; email: string; error: string }> }> {
    console.log('[EmployeesService.bulkImport] başladı', {
      companyId,
      fileSize: file.size,
      fileName: file.originalname,
    });

    const content = file.buffer.toString('utf-8');
    console.log('[EmployeesService.bulkImport] CSV içeriği (ilk 500 karakter)', 
      content.slice(0, 500));

    const rows = await this.parseCSV(content);
    console.log('[EmployeesService.bulkImport] parse edilen satırlar', {
      rowCount: rows.length,
      ilkSatir: rows[0],
    });

    let success_count = 0;
    let error_count   = 0;
    const errors: Array<{ row: number; email: string; error: string }> = [];

    const depts = await this.deptRepo.find({ where: { company_id: companyId } });
    const deptMap = Object.fromEntries(
      depts.map(d => [d.name.toLowerCase().trim(), d.id])
    );

    for (const [i, row] of rows.entries()) {
      console.log(`[EmployeesService.bulkImport] satır ${i + 2} işleniyor`, row);
      const lineNum = i + 2;

      if (!row.email || !row.full_name) {
        errors.push({ row: lineNum, email: row.email || '-', error: 'Ad Soyad ve E-posta zorunludur' });
        error_count++;
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push({ row: lineNum, email: row.email, error: 'Geçersiz e-posta formatı' });
        error_count++;
        continue;
      }

      let department_id: string | undefined;
      if (row.department) {
        const deptKey = row.department.toLowerCase().trim();
        department_id = deptMap[deptKey];

        if (!department_id) {
          // Departman yok → otomatik oluştur
          try {
            const newDept = this.deptRepo.create({
              name:       row.department.trim(),
              company_id: companyId,
              is_active:  true,
            });
            const saved = await this.deptRepo.save(newDept);
            department_id = saved.id;
            deptMap[deptKey] = saved.id; // cache'e ekle — aynı departman birden fazla satırda gelirse tekrar oluşturma
            this.logger.info('Yeni departman oluşturuldu (CSV import)', { service: 'EmployeesService' }, {
              name: row.department.trim(), companyId,
            });
          } catch (deptErr) {
            // Unique constraint: başka bir thread aynı anda oluşturduysa tekrar çek
            const existing = await this.deptRepo.findOne({
              where: { company_id: companyId, name: row.department.trim() }
            });
            if (existing) {
              department_id = existing.id;
              deptMap[deptKey] = existing.id;
            }
          }
        }
      }

      try {
        await this.create({
          full_name:     row.full_name.trim(),
          email:         row.email.trim().toLowerCase(),
          department_id,
          position:      row.position?.trim(),
          start_date:    row.start_date ? row.start_date : undefined,
        }, companyId);
        success_count++;
      } catch (err) {
        if (err instanceof ConflictException) {
          errors.push({ row: lineNum, email: row.email, error: 'Bu e-posta zaten kayıtlı' });
          error_count++;
        } else {
          errors.push({ row: lineNum, email: row.email, error: err.message });
          error_count++;
        }
      }
    }

    this.logger.info('CSV import tamamlandı', { service: 'EmployeesService' }, {
      success_count, error_count, errors: errors.length
    });

    return { success_count, error_count, errors };
  }

  private async parseCSV(content: string): Promise<Record<string, string>[]> {
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new BadRequestException('CSV boş veya başlık satırı yok');

    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase()
      .replace(/ad soyad|ad_soyad|fullname/g, 'full_name')
      .replace(/e-posta|eposta|email_address/g, 'email')
      .replace(/departman|department_name/g, 'department')
      .replace(/pozisyon|job_title/g, 'position')
      .replace(/başlangıç tarihi|baslangic_tarihi|startdate/g, 'start_date')
    );

    return lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
      return obj;
    });
  }

  // ── Listeleme ─────────────────────────────────────────────────────
  async findAll(companyId: string, filters: EmployeeFilterDto) {
    console.log('[EmployeesService.findAll] çağrıldı', {
      companyId,
      filters,
    });

    try {
      const qb = this.employeeRepo
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.department', 'd')
        .where('e.companyId = :companyId', { companyId })
        .andWhere('e.isActive = true');

      console.log('[EmployeesService.findAll] query parametreleri', {
        companyId,
        sql: qb.getSql(),
      });

      if (filters.department_id) {
        qb.andWhere('e.departmentId = :deptId', { deptId: filters.department_id });
      }
      if (filters.search) {
        qb.andWhere('(e.fullName ILIKE :q OR e.email ILIKE :q)',
          { q: `%${filters.search}%` });
      }

      const [data, total] = await qb
        .orderBy('e.fullName', 'ASC')
        .skip(((filters.page ?? 1) - 1) * (filters.limit ?? 20))
        .take(filters.limit ?? 20)
        .getManyAndCount();

      console.log('[EmployeesService.findAll] sonuç', {
        total,
        itemCount: data.length,
        ilkKayit: data[0] ?? 'BOŞ',
      });

      const employeeIds = data.map(e => e.id);
      let surveyCounts: Record<string, number> = {};
      if (employeeIds.length > 0) {
        const counts = await this.dataSource.query(
          `SELECT employee_id, COUNT(*) as count 
           FROM survey_tokens 
           WHERE employee_id = ANY($1) AND is_used = true 
           GROUP BY employee_id`,
          [employeeIds]
        );
        counts.forEach((c: any) => {
          surveyCounts[c.employee_id] = parseInt(c.count, 10);
        });
      }

      const mappedData = data.map(e => ({
        id:              e.id,
        full_name:       e.fullName,
        email:           e.email,
        department_id:   e.departmentId,
        department_name: e.department?.name || '-',
        position:        e.position,
        is_active:       e.isActive,
        status:          'active', // Default for now
        survey_count:    surveyCounts[e.id] || 0,
      }));

      return { 
        items: mappedData, 
        meta: { 
          total, 
          page: filters.page ?? 1, 
          per_page: filters.limit ?? 20 
        } 
      };

    } catch (err) {
      console.error('[EmployeesService.findAll] HATA', {
        message: err.message,
        stack:   err.stack,
      });
      throw err;
    }
  }

  async findOne(id: string, companyId: string) {
    const e = await this.employeeRepo.findOne({
      where: { id, companyId, isActive: true },
      relations: ['department']
    });
    if (!e) throw new NotFoundException('Çalışan bulunamadı');

    return {
      id:              e.id,
      full_name:       e.fullName,
      email:           e.email,
      department_id:   e.departmentId,
      department_name: e.department?.name || '-',
      position:        e.position,
      is_active:       e.isActive,
      start_date:      e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : undefined,
    };
  }

  // ── Güncelle ─────────────────────────────────────────────────────
  async update(id: string, dto: UpdateEmployeeDto, companyId: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id, companyId: companyId }
    });
    if (!employee) throw new NotFoundException('Çalışan bulunamadı');

    if (dto.department_id) {
      const dept = await this.deptRepo.findOne({
        where: { id: dto.department_id, company_id: companyId }
      });
      if (!dept) throw new BadRequestException('Departman bu firmaya ait değil');
    }

    // Map DTO to Entity
    if (dto.full_name !== undefined) employee.fullName = dto.full_name;
    if (dto.department_id !== undefined) employee.departmentId = dto.department_id;
    if (dto.position !== undefined) employee.position = dto.position;
    if (dto.start_date !== undefined) employee.startDate = dto.start_date ? new Date(dto.start_date) : null;
    if (dto.isActive !== undefined) employee.isActive = dto.isActive;

    await this.employeeRepo.save(employee);
    return { updated: true };
  }

  // ── Pasife al ─────────────────────────────────────────────────────
  async deactivate(id: string, companyId: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id, companyId }
    });
    if (!employee) throw new NotFoundException('Çalışan bulunamadı');
    await this.employeeRepo.update(id, {
      isActive:      false,
      deactivatedAt: new Date(),
    });
    this.logger.info('Çalışan pasife alındı', { service: 'EmployeesService' }, { id });
    return { deactivated: true };
  }

  // ── Kalıcı sil (hard delete) ─────────────────────────────────────
  async hardDelete(id: string, companyId: string): Promise<{
    deleted: boolean;
    anonymized: { responses: number; tokens: number };
  }> {
    this.logger.info('Hard delete başladı', { service: 'EmployeesService' }, { id, companyId });

    // 1. Sahiplik kontrolü
    const employee = await this.employeeRepo.findOne({ where: { id, companyId } });
    if (!employee) {
      this.logger.warn('Silinecek çalışan bulunamadı', { service: 'EmployeesService' }, { id });
      throw new NotFoundException('Çalışan bulunamadı');
    }

    // 2. survey_responses → user_id NULL yap (user_id = employee bağlantısı)
    const [, responseCount] = await this.dataSource.query(
      `UPDATE survey_responses SET user_id = NULL WHERE user_id = $1`,
      [id]
    );
    const anonymizedResponses = responseCount ?? 0;

    // 3. survey_tokens → employee_id NULL + is_used = true
    const [, tokenCount] = await this.dataSource.query(
      `UPDATE survey_tokens SET employee_id = NULL, is_used = true WHERE employee_id = $1`,
      [id]
    );
    const invalidatedTokens = tokenCount ?? 0;

    // 4. onboarding_assignments → CASCADE ile silinir (FK ayarlı)
    // Güvenlik için elle de silelim
    await this.dataSource.query(
      `DELETE FROM onboarding_assignments WHERE user_id = $1`,
      [id]
    );

    // 5. Çalışanı tamamen sil
    await this.employeeRepo.delete({ id });

    this.logger.info('Hard delete tamamlandı', { service: 'EmployeesService' }, {
      id, email: employee.email, anonymizedResponses, invalidatedTokens,
    });

    return {
      deleted:    true,
      anonymized: { responses: anonymizedResponses, tokens: invalidatedTokens },
    };
  }
}
