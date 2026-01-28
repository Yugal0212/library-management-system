import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller('loan')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post('borrow')
  @UseGuards(JwtAuthGuard)
  borrow(@CurrentUser() user: any, @Body() dto: CreateLoanDto) {
    // Set userId from JWT token
    dto.userId = user.sub;
    return this.loanService.borrow(dto);
  }

  @Post('create-for-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async createLoanForUser(@Body() dto: CreateLoanDto) {
    const loan = await this.loanService.borrow(dto);
    return { message: 'Loan created successfully', data: loan };
  }

  @Patch(':id/return')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async return(@Param('id') id: string) {
    const result = await this.loanService.return(id);
    return { message: 'Book returned successfully', data: result };
  }

  @Patch(':id/renew')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async renew(@Param('id') id: string) {
    const loan = await this.loanService.renew(id);
    return { message: 'Loan renewed successfully', data: loan };
  }

  @Get('my-loans')
  @UseGuards(JwtAuthGuard)
  async getMyLoans(@CurrentUser() user: any) {
    const loans = await this.loanService.getUserLoans(user.sub);
    return { message: 'Your loans fetched successfully', data: loans };
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async getAllLoans() {
    const loans = await this.loanService.getAllLoans();
    return { message: 'All loans fetched successfully', data: loans };
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async getUserLoans(@Param('userId') userId: string) {
    try {
      const loans = await this.loanService.getUserLoans(userId);
      return {
        message: `Loans for user ${userId} fetched successfully`,
        data: loans,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('overdue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async getOverdueLoans() {
    try {
      const loans = await this.loanService.getOverdueLoans();
      return { message: 'Overdue loans fetched successfully', data: loans };
    } catch (error) {
      throw error;
    }
  }

  @Post('send-due-reminders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async sendDueDateReminders() {
    return this.loanService.sendDueDateReminders();
  }

  @Post('send-overdue-notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async sendOverdueNotifications() {
    return this.loanService.sendOverdueNotifications();
  }

  @Post(':loanId/request-return')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  async requestReturn(
    @Param('loanId') loanId: string,
    @CurrentUser() user: any,
  ) {
    const loan = await this.loanService.requestReturn(loanId, user.sub);
    return { message: 'Return requested successfully', data: loan };
  }

  @Post(':loanId/confirm-return')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async confirmReturn(@Param('loanId') loanId: string) {
    const loan = await this.loanService.confirmReturn(loanId);
    return { message: 'Return confirmed successfully', data: loan };
  }
}
