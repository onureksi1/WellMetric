import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeesService } from './employees.service';
import { EmployeeSurveyService } from './employee-survey.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilterDto } from './dto/employee.dto';

@Controller('hr/employees-no-account')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles('hr_admin', 'super_admin')
export class HrEmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly surveyService: EmployeeSurveyService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query() filters: EmployeeFilterDto) {
    console.log('[HrEmployeesController.findAll] çağrıldı', {
      userId:    user?.id,
      companyId: user?.company_id,
      role:      user?.role,
      filters,
    });

    const result = await this.employeesService.findAll(user.company_id, filters);

    console.log('[HrEmployeesController.findAll] dönen sonuç', {
      itemCount: result?.items?.length,
      total:     result?.meta?.total,
    });

    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.findOne(id, user.company_id);
  }

  @Post()
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: any) {
    return this.employeesService.create(dto, user.company_id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.update(id, dto, user.company_id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.deactivate(id, user.company_id);
  }

  @Delete(':id')
  hardDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.hardDelete(id, user.company_id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('CSV dosyası gerekli');
    return this.employeesService.bulkImport(file, user.company_id);
  }

  @Post(':id/send-survey')
  sendSurvey(
    @Param('id') employeeId: string,
    @Body() dto: { survey_id: string; period: string },
    @CurrentUser() user: any,
  ) {
    return this.surveyService.sendToSingle(
      employeeId,
      dto.survey_id,
      user.company_id,
      dto.period,
    );
  }

  @Post('send-survey/all')
  sendSurveyToAll(
    @Body() dto: { survey_id: string; period: string },
    @CurrentUser() user: any,
  ) {
    return this.surveyService.sendSurveyToAll(
      user.company_id,
      dto.survey_id,
      dto.period,
    );
  }
}
