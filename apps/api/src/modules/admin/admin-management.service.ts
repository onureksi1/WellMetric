import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin-management.dto';
import bcrypt from 'bcryptjs';

@Injectable()
export class AdminManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find({
      where: { role: 'super_admin' },
      order: { created_at: 'DESC' },
    });
  }

  async create(dto: CreateAdminDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = this.userRepository.create({
      email: dto.email,
      full_name: dto.full_name,
      password_hash: hashedPassword,
      role: 'super_admin',
      is_active: true,
    });

    return this.userRepository.save(admin);
  }

  async update(id: string, dto: UpdateAdminDto) {
    const admin = await this.userRepository.findOne({ 
      where: { id, role: 'super_admin' } 
    });

    if (!admin) {
      throw new NotFoundException('Yönetici bulunamadı.');
    }

    if (dto.email && dto.email !== admin.email) {
      const existing = await this.userRepository.findOne({ 
        where: { email: dto.email, id: Not(id) } 
      });
      if (existing) {
        throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
      }
      admin.email = dto.email;
    }

    if (dto.full_name) {
      admin.full_name = dto.full_name;
    }

    if (dto.password) {
      admin.password_hash = await bcrypt.hash(dto.password, 10);
    }

    return this.userRepository.save(admin);
  }

  async delete(id: string) {
    const admin = await this.userRepository.findOne({ 
      where: { id, role: 'super_admin' } 
    });

    if (!admin) {
      throw new NotFoundException('Yönetici bulunamadı.');
    }

    // At least one admin must remain
    const count = await this.userRepository.count({ 
      where: { role: 'super_admin' } 
    });

    if (count <= 1) {
      throw new BadRequestException('Sistemde en az bir yönetici bulunmalıdır. Son yöneticiyi silemezsiniz.');
    }

    await this.userRepository.remove(admin);
    return { success: true };
  }
}
