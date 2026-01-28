import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FinesService } from './fines.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { UpdateFineDto } from './dto/update-fine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('fines')
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  create(@Body() dto: CreateFineDto) {
    return this.finesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async findAll() {
    const fines = await this.finesService.findAll();
    return { message: 'All fines fetched successfully', data: fines };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyFines(@CurrentUser() user: any) {
    const fines = await this.finesService.findByUser(user.sub);
    return { message: 'Your fines fetched successfully', data: fines };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.finesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateFineDto) {
    return this.finesService.update(id, dto);
  }

  @Patch(':id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  markAsPaid(@Param('id') id: string) {
    return this.finesService.markAsPaid(id);
  }

  @Patch(':id/waive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  waiveFine(@Param('id') id: string, @CurrentUser() user: any) {
    return this.finesService.waiveFine(id, user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.finesService.remove(id);
  }

  @Post('calculate-overdue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  calculateOverdueFines() {
    return this.finesService.calculateOverdueFines();
  }

  @Post(':id/send-reminder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  sendFineReminder(@Param('id') id: string) {
    return this.finesService.sendFineReminder(id);
  }
}
