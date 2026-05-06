import { Controller, Post, Body, UseGuards, Req, BadRequestException, Put, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { Response } from 'express';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'hr_admin', 'consultant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  async getPresignedUrl(@Req() req: any, @Body() dto: PresignedUrlDto) {
    console.log('[UploadController] getPresignedUrl called', { dto, user: req.user?.id });
    try {
      // 1. file_type whitelist check
      const allowedFileTypes = ['logo', 'csv', 'pdf', 'platform_logo'];
      if (!allowedFileTypes.includes(dto.file_type)) {
        throw new BadRequestException('Geçersiz file_type');
      }

      // 2. mime_type whitelist check
      const allowedMimeTypes = {
        logo: ['image/jpeg', 'image/png', 'image/webp'],
        platform_logo: ['image/jpeg', 'image/png', 'image/webp'],
        csv:  ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
        pdf:  ['application/pdf'],
      };
      if (!allowedMimeTypes[dto.file_type].includes(dto.mime_type)) {
        throw new BadRequestException(`Geçersiz mime_type. ${dto.file_type} için izin verilenler: ${allowedMimeTypes[dto.file_type].join(', ')}`);
      }

      // 3. file_size limit check
      const maxSizes = { 
        logo: 2 * 1024 * 1024,   // 2MB
        platform_logo: 2 * 1024 * 1024, // 2MB
        csv:  10 * 1024 * 1024,  // 10MB
        pdf:  20 * 1024 * 1024,  // 20MB
      };
      if (dto.file_size > maxSizes[dto.file_type]) {
        const limitMb = Math.round(maxSizes[dto.file_type] / 1024 / 1024);
        throw new BadRequestException(`Dosya boyutu limiti aşıldı. Bu tip için limit: ${limitMb}MB`);
      }

      const companyId = req.user.role === 'super_admin' && dto.company_id 
        ? dto.company_id 
        : req.user.company_id;
        
      console.log('[UploadController] Dispatching to service', { companyId });
      const result = await this.uploadService.getPresignedPutUrl(dto, companyId);
      console.log('[UploadController] Success result', result);
      return result;
    } catch (err) {
      console.error('[UploadController] Error in getPresignedUrl', err);
      throw err;
    }
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'hr_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm file upload and trigger processing' })
  async confirmUpload(@Req() req: any, @Body() dto: ConfirmUploadDto) {
    console.log('[UploadController] confirmUpload called', dto);
    try {
      const companyId = req.user.company_id;
      return await this.uploadService.confirmUpload(dto, companyId);
    } catch (err) {
      console.error('[UploadController] Error in confirmUpload', err);
      throw err;
    }
  }

  @Put('local-mock')
  @ApiOperation({ summary: 'Local storage mock PUT' })
  async localMockPut(@Query('key') key: string, @Req() req: any) {
    if (!key) throw new BadRequestException('Key required');
    
    // Read raw body manually from stream to ensure we get a Buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    if (buffer.length === 0 && req.rawBody) {
      // Fallback if stream was already consumed
      await this.uploadService.saveLocalMock(key, req.rawBody);
    } else {
      await this.uploadService.saveLocalMock(key, buffer);
    }
    
    return { success: true };
  }

  @Get('local-mock')
  @ApiOperation({ summary: 'Local storage mock GET' })
  async localMockGet(@Query('key') key: string, @Res() res: Response) {
    if (!key) throw new BadRequestException('Key required');
    const buffer = await this.uploadService.getLocalMock(key);
    res.set('Content-Type', 'application/octet-stream');
    res.send(buffer);
  }
}
