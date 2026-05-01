import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditType } from '../entities/credit-type.entity';
import { CreateCreditTypeDto } from '../dto/create-credit-type.dto';

@Injectable()
export class CreditTypeService {
  constructor(
    @InjectRepository(CreditType)
    private readonly creditTypeRepository: Repository<CreditType>,
  ) {}

  async findAll(includeInactive = false) {
    return this.creditTypeRepository.find({
      where: includeInactive ? {} : { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  async findOne(key: string) {
    const type = await this.creditTypeRepository.findOne({ where: { key } });
    if (!type) {
      throw new NotFoundException(`Credit type with key ${key} not found`);
    }
    return type;
  }

  async create(dto: CreateCreditTypeDto) {
    const existing = await this.creditTypeRepository.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Credit type with key ${dto.key} already exists`);
    }
    
    const type = this.creditTypeRepository.create(dto);
    return this.creditTypeRepository.save(type);
  }

  async update(key: string, dto: Partial<CreateCreditTypeDto>) {
    const type = await this.findOne(key);
    Object.assign(type, dto);
    return this.creditTypeRepository.save(type);
  }

  async updateStatus(key: string, isActive: boolean) {
    const type = await this.findOne(key);
    type.is_active = isActive;
    return this.creditTypeRepository.save(type);
  }
}
