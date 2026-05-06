import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ConsultantGuard } from '../../common/guards/consultant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConsultantContentService } from './consultant-content.service';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { UpdateContentItemDto } from './dto/update-content-item.dto';
import { AssignContentDto } from './dto/assign-content.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Controller('consultant/content')
@UseGuards(JwtAuthGuard, ConsultantGuard)
export class ConsultantContentController {
  constructor(private readonly contentService: ConsultantContentService) {}

  // ── İçerik CRUD ─────────────────────────────────────────────────
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.contentService.findAll(user.id);
  }

  @Post()
  create(@Body() dto: CreateContentItemDto, @CurrentUser() user: any) {
    return this.contentService.create(dto, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContentItemDto,
    @CurrentUser() user: any,
  ) {
    return this.contentService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contentService.remove(id, user.id);
  }

  // ── Atama ────────────────────────────────────────────────────────
  @Get('assignments')
  findAssignments(
    @CurrentUser() user: any,
    @Query('company_id') companyId?: string,
    @Query('status') status?: string,
  ) {
    return this.contentService.findAssignments(user.id, {
      company_id: companyId,
      status,
    });
  }

  @Post('assignments')
  assign(@Body() dto: AssignContentDto, @CurrentUser() user: any) {
    return this.contentService.assign(dto, user.id);
  }

  @Put('assignments/:id')
  updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.contentService.updateAssignment(id, dto, user.id);
  }

  @Delete('assignments/:id')
  removeAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contentService.removeAssignment(id, user.id);
  }

  // ── Gönder ───────────────────────────────────────────────────────
  @Post('assignments/:id/send')
  send(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contentService.send(id, user.id);
  }

  // ── AI Önerisi ───────────────────────────────────────────────────
  @Post(':id/suggest')
  async suggest(
    @Param('id') contentItemId: string,
    @CurrentUser() user: any,
  ) {
    return this.contentService.suggestAssignments(
      contentItemId,
      user.id,
    );
  }

  // ── Toplu Atama ──────────────────────────────────────────────────
  @Post(':id/bulk-assign')
  async bulkAssign(
    @Param('id') contentItemId: string,
    @Body() dto: { company_ids: string[]; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.contentService.bulkAssign(
      contentItemId,
      dto.company_ids,
      user.id,
      dto.notes,
    );
  }
}
