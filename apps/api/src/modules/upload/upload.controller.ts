import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

@ApiTags('Uploads')
@Controller('api/v1/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  @Roles('super_admin', 'hr_admin')
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  async getPresignedUrl(@Req() req: any, @Body() dto: PresignedUrlDto) {
    const companyId = req.user.role === 'super_admin' && dto.company_id 
      ? dto.company_id 
      : req.user.company_id;
      
    return this.uploadService.getPresignedPutUrl(dto, companyId);
  }

  @Post('confirm')
  @Roles('super_admin', 'hr_admin')
  @ApiOperation({ summary: 'Confirm file upload and trigger processing' })
  async confirmUpload(@Req() req: any, @Body() dto: ConfirmUploadDto) {
    const companyId = req.user.company_id;
    return this.uploadService.confirmUpload(dto, companyId);
  }
}
