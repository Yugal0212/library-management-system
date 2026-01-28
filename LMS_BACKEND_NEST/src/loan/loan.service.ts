import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ItemStatus, ActivityType, LoanStatus } from '../common/enums';
import { MailerService } from '../auth/mailer.service';
import { ReservationService } from '../reservation/reservation.service';
import { TransactionService } from '../common/transaction.service';

@Injectable()
export class LoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly reservationService: ReservationService,
    private readonly transactionService: TransactionService,
  ) {}

  async borrow(createLoanDto: CreateLoanDto) {
    const { itemId } = createLoanDto;
    let { userId } = createLoanDto;

    // Ensure userId is provided
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Now userId is guaranteed to be a string
    const userIdString: string = userId;

    // Ensure book is available
    const item = await this.prisma.libraryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Book not found');
    if (item.isArchived) throw new BadRequestException('Book is archived and cannot be borrowed');
    if (item.status !== 'AVAILABLE') throw new BadRequestException('Book already borrowed');

    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 14);

    const loanIdCreated = await this.prisma.$transaction(async (tx) => {
      const created = await tx.loan.create({
        data: {
          userId: userIdString,
          itemId,
          loanDate: now,
          dueDate: due,
        },
      });

      await tx.libraryItem.update({
        where: { id: itemId },
        data: { status: 'BORROWED' },
      });

      return created.id;
    });

    // Fetch full loan with relations AFTER commit for notifications
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanIdCreated },
      include: { user: true, item: true },
    });

    if (loan) {
      await this.transactionService.logActivity(
        userIdString,
        ActivityType.LOAN_CREATED,
        `Borrowed "${item.title}" (ID: ${itemId})`
      );

      await this.mailer.sendLoanEmail(
        loan.user.email,
        loan.user.name,
        loan.item.title,
        loan.dueDate,
      );
    }

    return loan as any;
  }

  async return(loanId: string) {
    const existing = await this.prisma.loan.findUnique({ 
      where: { id: loanId },
      include: { user: true, item: true },
    });
    if (!existing) throw new NotFoundException('Loan not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.loan.update({
        where: { id: loanId },
        data: { returnDate: new Date(), status: 'RETURNED' } as any,
      });

      await tx.libraryItem.update({
        where: { id: existing.itemId },
        data: { status: 'AVAILABLE' },
      });
    });

    const updated = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: true, item: true },
    });

    if (updated) {
      await this.transactionService.logActivity(
        existing.userId,
        ActivityType.LOAN_RETURNED,
        `Returned "${existing.item.title}" (ID: ${updated.itemId})`
      );

      await this.mailer.sendReturnEmail(
        updated.user.email,
        updated.user.name,
        updated.item.title,
      );

      await this.reservationService.checkAndFulfillReservations(updated.itemId);
    }

    return updated as any;
  }

  async requestReturn(loanId: string, userId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { item: true, user: true },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.userId !== userId) throw new ForbiddenException('You can only request return for your own loan');
    if (loan.returnDate || (loan as any).status === 'RETURNED') throw new BadRequestException('Loan already returned');
    if ((loan as any).status === 'PENDING_RETURN') throw new BadRequestException('Return already requested');

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.PENDING_RETURN } as any,
      include: { item: true, user: true },
    });

    return updated;
  }

  async confirmReturn(loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { item: true, user: true },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.returnDate || (loan as any).status === 'RETURNED') throw new BadRequestException('Loan already returned');
    if ((loan as any).status !== 'PENDING_RETURN') throw new BadRequestException('Return must be requested before confirmation');

    await this.prisma.$transaction(async (tx) => {
      await tx.loan.update({
        where: { id: loanId },
        data: { returnDate: new Date(), status: 'RETURNED' } as any,
      });

      await tx.libraryItem.update({
        where: { id: loan.itemId },
        data: { status: 'AVAILABLE' },
      });
    });

    const updated = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: true, item: true },
    });

    if (updated) {
      await this.transactionService.logActivity(
        loan.userId,
        ActivityType.LOAN_RETURNED,
        `Returned "${loan.item.title}" (ID: ${updated.itemId})`
      );

      await this.mailer.sendReturnEmail(
        updated.user.email,
        updated.user.name,
        updated.item.title,
      );

      await this.reservationService.checkAndFulfillReservations(updated.itemId);
    }

    return updated as any;
  }

  async renew(loanId: string) {
    const existing = await this.prisma.loan.findUnique({ 
      where: { id: loanId },
      include: { item: true, user: true }
    });
    if (!existing) throw new NotFoundException('Loan not found');
    if (existing.returnDate) throw new BadRequestException('Cannot renew a returned loan');

    const newDue = new Date(existing.dueDate);
    newDue.setDate(newDue.getDate() + 14);

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: { dueDate: newDue, renewalCount: (existing.renewalCount ?? 0) + 1 },
    });

    // Log transaction
    await this.transactionService.logActivity(
      existing.userId,
      ActivityType.LOAN_RENEWED,
      `Renewed "${existing.item.title}" - New due date: ${newDue.toDateString()}`
    );

    return updated;
  }

  async getAllLoans() {
    const loans = await this.prisma.loan.findMany({
      include: { 
        item: {
          include: {
            categories: {
              include: { category: true }
            }
          }
        }, 
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { loanDate: 'desc' },
    });

    // Flatten category data for each loan item
    return loans.map(loan => ({
      ...loan,
      libraryItem: {
        ...loan.item,
        author: (loan.item.metadata as any)?.author || null,
        category: loan.item.categories?.[0]?.category?.name || null,
      },
      item: undefined // Remove the original item field since we're using libraryItem
    }));
  }

  async getOverdueLoans() {
    const loans = await this.prisma.loan.findMany({
      where: { dueDate: { lt: new Date() }, returnDate: null },
      include: { 
        item: {
          include: {
            categories: {
              include: { category: true }
            }
          }
        }, 
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { loanDate: 'desc' },
    });

    // Flatten category data for each loan item
    return loans.map(loan => ({
      ...loan,
      libraryItem: {
        ...loan.item,
        author: (loan.item.metadata as any)?.author || null,
        category: loan.item.categories?.[0]?.category?.name || null,
      },
      item: undefined // Remove the original item field since we're using libraryItem
    }));
  }

  async getUserLoans(userId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { userId },
      include: { 
        item: {
          include: {
            categories: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { loanDate: 'desc' },
    });

    // Flatten category data for each loan item
    return loans.map(loan => ({
      ...loan,
      libraryItem: {
        ...loan.item,
        author: (loan.item.metadata as any)?.author || null,
        category: loan.item.categories?.[0]?.category?.name || null,
      },
      item: undefined // Remove the original item field since we're using libraryItem
    }));
  }

  async sendDueDateReminders() {
    // Send reminders 1 day before due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const loansDueTomorrow = await this.prisma.loan.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        returnDate: null,
      },
      include: {
        user: true,
        item: true,
      },
    });

    for (const loan of loansDueTomorrow) {
      await this.mailer.sendDueDateReminderEmail(
        loan.user.email,
        loan.user.name,
        loan.item.title,
        loan.dueDate,
      );
    }

    return { message: `Sent ${loansDueTomorrow.length} due date reminders` };
  }

  async sendOverdueNotifications() {
    const overdueLoans = await this.prisma.loan.findMany({
      where: {
        dueDate: { lt: new Date() },
        returnDate: null,
      },
      include: {
        user: true,
        item: true,
      },
    });

    for (const loan of overdueLoans) {
      const daysOverdue = Math.floor((new Date().getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * 1.0; // $1 per day

      await this.mailer.sendOverdueEmail(
        loan.user.email,
        loan.user.name,
        loan.item.title,
        loan.dueDate,
        fineAmount,
      );
    }

    return { message: `Sent ${overdueLoans.length} overdue notifications` };
  }
}
