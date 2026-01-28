import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { TransactionService } from '../common/transaction.service';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createActivityDto: CreateActivityDto, @CurrentUser() user: any) {
    return this.activitiesService.create(createActivityDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    // Use the new transaction service for better activity logging
    if (!userId && !action && !from && !to) {
      const limitNum = limit ? parseInt(limit, 10) : 100;
      return this.transactionService.getAllActivities(limitNum);
    }
    
    // Fall back to original service for filtered queries
    return this.activitiesService.findAll({
      userId: userId || undefined,
      action: action || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyActivities(@CurrentUser() user: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.transactionService.getUserActivities(user.id, limitNum);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  getStats() {
    return this.transactionService.getActivityStats();
  }

  @Get('stats/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  getUserStats(@Param('userId') userId: string) {
    return this.transactionService.getActivityStats(userId);
  }
}