import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const ALLOWED_TYPES = {
  logo: ['image/jpeg', 'image/png', 'image/webp'],
  csv:  ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
  pdf:  ['application/pdf'],
};

const MAX_SIZES = {
  logo: 2 * 1024 * 1024,   // 2MB
  csv:  10 * 1024 * 1024,  // 10MB
  pdf:  20 * 1024 * 1024,  // 20MB
};

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly fileType: 'logo' | 'csv' | 'pdf') {}

  transform(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı');

    const allowed = ALLOWED_TYPES[this.fileType];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `Geçersiz dosya tipi. İzin verilenler: ${allowed.join(', ')}`
      );
    }

    const maxSize = MAX_SIZES[this.fileType];
    if (file.size > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024);
      throw new BadRequestException(`Dosya ${mb}MB'dan büyük olamaz`);
    }

    return file;
  }
}
