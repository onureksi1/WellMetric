import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductPackage } from '../entities/product-package.entity';
import { CreatePackageDto } from '../dto/create-package.dto';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(ProductPackage)
    private readonly packageRepository: Repository<ProductPackage>,
  ) {}

  async findAll(type?: string, includeInactive = false, onlyVisible = false) {
    const where: any = {};
    
    if (!includeInactive) {
      where.is_active = true;
    }
    
    if (onlyVisible) {
      where.is_visible = true;
    }

    if (type) {
      where.type = type;
    }

    return this.packageRepository.find({
      where,
      order: { sort_order: 'ASC' },
    });
  }

  async findOne(key: string) {
    const pkg = await this.packageRepository.findOne({ where: { key } });
    if (!pkg) {
      throw new NotFoundException(`Package with key ${key} not found`);
    }
    return pkg;
  }

  async create(dto: CreatePackageDto) {
    const existing = await this.packageRepository.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Package with key ${dto.key} already exists`);
    }

    const pkg = this.packageRepository.create(dto);
    return this.packageRepository.save(pkg);
  }

  async update(key: string, dto: Partial<CreatePackageDto>) {
    const pkg = await this.findOne(key);
    Object.assign(pkg, dto);
    return this.packageRepository.save(pkg);
  }

  async updateStatus(key: string, isActive: boolean) {
    await this.findOne(key);
    await this.packageRepository.update({ key }, { is_active: isActive });
    return { updated: true };
  }

  async toggleVisibility(key: string, isVisible: boolean) {
    await this.findOne(key);
    await this.packageRepository.update({ key }, { is_visible: isVisible });
    return { updated: true };
  }

  async delete(key: string) {
    const pkg = await this.findOne(key);
    return this.packageRepository.remove(pkg);
  }
}
