import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionStatusDto } from './dto/update-action-status.dto';
import { ActionFilterDto } from './dto/action-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Action')
@Controller('api/v1/hr/actions')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth()
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Get()
  @Roles('super_admin', 'hr_admin')
  @ApiOperation({ summary: 'List all actions for the company' })
  findAll(@Req() req: any, @Query() filters: ActionFilterDto) {
    return this.actionService.findAll(req.user.company_id, filters);
  }

  @Post()
  @Roles('super_admin', 'hr_admin')
  @ApiOperation({ summary: 'Create new action' })
  create(@Req() req: any, @Body() dto: CreateActionDto) {
    return this.actionService.create(req.user.company_id, req.user.id, dto);
  }

  @Get('suggestions')
  @Roles('super_admin', 'hr_admin')
  @ApiOperation({ summary: 'Get action suggestions based on wellbeing scores' })
  @ApiQuery({ name: 'dimension', required: true })
  @ApiQuery({ name: 'department_id', required: false })
  @ApiQuery({ name: 'period', required: false })
  getSuggestions(
    @Req() req: any,
    @Query('dimension') dimension: string,
    @Query('department_id') departmentId?: string,
    @Query('period') period?: string,
  ) {
    return this.actionService.getActionSuggestions(req.user.company_id, dimension, departmentId, period);
  }

  @Get(':id')
  @Roles('super_admin', 'hr_admin')
  @ApiOperation({ summary: 'Get action detail' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.actionService.findOne(id, req.user.company_id);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'hr_admin')
  @ApiOperation({ summary: 'Update action status' })
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateActionStatusDto,
  ) {
    return this.actionService.updateStatus(id, req.user.company_id, req.user.id, dto);
  }

  @Delete(':id')
  @Roles('super_admin', 'hr_admin')
  @ApiOperation({ summary: 'Delete action' })
  delete(@Req() req: any, @Param('id') id: string) {
    return this.actionService.delete(id, req.user.company_id, req.user.id);
  }
}
