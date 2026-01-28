import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { UpdateFineDto } from './dto/update-fine.dto';
// FineStatus comes from Prisma schema; we use string literals for status values here
import { MailerService } from '../auth/mailer.service';

@Injectable()
export class FinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async create(dto: CreateFineDto) {
    const { userId, loanId, amount, reason } = dto;

    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Verify loan exists if provided
    if (loanId) {
      const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
      if (!loan) throw new NotFoundException('Loan not found');
    }

    const fine = await this.prisma.fine.create({
      data: {
        userId,
        loanId,
        amount,
        reason: reason || 'Overdue fine',
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        loan: { select: { id: true, item: { select: { title: true } } } },
      },
    });

    // Log activity
    await this.prisma.transaction.create({
      data: {
        userId,
        action: 'FINE_APPLIED',
        details: `Fine ${fine.id} applied: $${amount} - ${reason || 'Overdue fine'}`,
      },
    });

    return fine;
  }

  async findAll() {
    return this.prisma.fine.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        loan: { 
          select: { 
            id: true, 
            dueDate: true,
            item: { 
              select: { 
                id: true,
                title: true, 
                isbn: true,
                type: true,
                description: true,
                metadata: true 
              } 
            } 
          } 
        },
        waivedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.fine.findMany({
      where: { userId },
      include: {
        loan: { 
          select: { 
            id: true, 
            dueDate: true,
            item: { 
              select: { 
                id: true,
                title: true, 
                isbn: true,
                type: true,
                description: true,
                metadata: true 
              } 
            } 
          } 
        },
        waivedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const fine = await this.prisma.fine.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        loan: { select: { id: true, item: { select: { title: true } } } },
        waivedBy: { select: { id: true, name: true } },
      },
    });

    if (!fine) throw new NotFoundException('Fine not found');
    return fine;
  }

  async update(id: string, dto: UpdateFineDto) {
    const fine = await this.prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundException('Fine not found');

    const updatedFine = await this.prisma.fine.update({
      where: { id },
      data: dto,
      include: {
        user: { select: { id: true, name: true, email: true } },
        loan: { select: { id: true, item: { select: { title: true } } } },
        waivedBy: { select: { id: true, name: true } },
      },
    });

    return updatedFine;
  }

  async markAsPaid(id: string) {
    const fine = await this.prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundException('Fine not found');
    if (fine.status === 'PAID') throw new BadRequestException('Fine is already paid');
    if (fine.status === 'WAIVED') throw new BadRequestException('Fine is already waived');

    const updatedFine = await this.prisma.fine.update({
      where: { id },
      data: { status: 'PAID' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        loan: { select: { id: true, item: { select: { title: true } } } },
      },
    });

    // Log activity
    await this.prisma.transaction.create({
      data: {
        userId: fine.userId,
        action: 'FINE_PAID',
        details: `Fine ${id} marked as paid`,
      },
    });

    return updatedFine;
  }

  async waiveFine(id: string, waivedById: string) {
    const fine = await this.prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundException('Fine not found');
    if (fine.status === 'PAID') throw new BadRequestException('Cannot waive a paid fine');
    if (fine.status === 'WAIVED') throw new BadRequestException('Fine is already waived');

    const updatedFine = await this.prisma.fine.update({
      where: { id },
      data: { 
        status: 'WAIVED',
        waivedById,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        loan: { select: { id: true, item: { select: { title: true } } } },
        waivedBy: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await this.prisma.transaction.create({
      data: {
        userId: waivedById,
        action: 'FINE_WAIVED',
        details: `Fine ${id} waived by ${waivedById}`,
      },
    });

    return updatedFine;
  }

  async remove(id: string) {
    const fine = await this.prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundException('Fine not found');

    await this.prisma.fine.delete({ where: { id } });
    return { message: 'Fine deleted successfully' };
  }

  async calculateOverdueFines() {
    // Get all overdue loans
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

    // Get library settings for fine calculation
    const settings = await this.prisma.librarySettings.findFirst();
    const finePerDay = settings?.overdueFinePerDay || 1.0;

    let finesCreated = 0;

    for (const loan of overdueLoans) {
      const daysOverdue = Math.floor((new Date().getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * Number(finePerDay);

      // Check if fine already exists for this loan
      const existingFine = await this.prisma.fine.findFirst({
        where: {
          loanId: loan.id,
          status: 'PENDING',
        },
      });

      if (!existingFine && fineAmount > 0) {
        await this.create({
          userId: loan.userId,
          loanId: loan.id,
          amount: fineAmount,
          reason: `Overdue fine for ${daysOverdue} days`,
        });
        finesCreated++;
      }
    }

    return { message: 'Overdue fines calculated successfully', finesCreated };
  }

  async sendFineReminder(fineId: string) {
    // Get fine with basic info first
    const fine = await this.prisma.fine.findUnique({
      where: { id: fineId },
    });

    if (!fine) {
      throw new NotFoundException('Fine not found');
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: fine.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user?.email) {
      throw new BadRequestException('User email not found');
    }

    // Get loan and book info if loan exists
    let bookTitle = 'Unknown Book';
    let bookAuthor = 'Unknown Author';
    let dueDate = 'Unknown';

    if (fine.loanId) {
      const loan = await this.prisma.loan.findUnique({
        where: { id: fine.loanId },
        include: {
          item: { select: { title: true } },
        },
      });

      if (loan) {
        bookTitle = loan.item?.title || 'Unknown Book';
        dueDate = loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'Unknown';
      }
    }

    const subject = 'Library Fine Payment Reminder';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Library Fine Payment Reminder</h2>
        <p>Dear ${user.name},</p>
        <p>This is a reminder that you have an outstanding fine that requires your attention:</p>
        
        <div style="background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Fine Details</h3>
          <p><strong>Amount:</strong> $${Number(fine.amount).toFixed(2)}</p>
          <p><strong>Reason:</strong> ${fine.reason || 'Library fine'}</p>
          <p><strong>Book:</strong> ${bookTitle}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        
        <p>Please visit the library or contact us to arrange payment of this fine.</p>
        <p>Thank you for your cooperation.</p>
        
        <p style="margin-top: 32px;">
          <strong>Library Management System</strong><br>
          <small>This is an automated message. Please do not reply to this email.</small>
        </p>
      </div>
    `;

    try {
      await this.mailerService.sendOtpEmail(user.email, subject, html);

      // Log the reminder activity
      await this.prisma.transaction.create({
        data: {
          userId: fine.userId,
          action: 'FINE_APPLIED', // Using existing ActivityType
          details: `Fine reminder sent for fine ${fine.id} ($${fine.amount})`,
        },
      });

      return { 
        message: 'Fine reminder sent successfully',
        sentTo: user.email 
      };
    } catch (error) {
      throw new BadRequestException('Failed to send email reminder');
    }
  }
}
