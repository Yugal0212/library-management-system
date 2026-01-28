import { Controller, Get, Patch, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../common/enums';
import { PrismaService } from '../../prisma.service';
import { MailerService } from '../auth/mailer.service';
// Avoid relying on Prisma namespace types here (can differ between generated clients).

@Controller('librarian-requests')
@UseGuards(JwtAuthGuard, new RoleGuard(UserRole.ADMIN))
export class LibrarianRequestsController {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  @Get()
  async getLibrarianRequests() {
    return this.prisma.pendingLibrarian.findMany({
      where: {
        status: 'PENDING',
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        metadata: true,
        status: true,
        expiresAt: true,
      },
    });
  }

  @Patch(':id/approve')
  async approveLibrarian(@Param('id') id: string) {
    const pendingLibrarian = await this.prisma.pendingLibrarian.findUnique({
      where: { id },
    });

    if (!pendingLibrarian) {
      throw new BadRequestException('Request not found');
    }

    try {
      // Create the librarian user
      await this.prisma.$transaction(async (tx) => {
  // Convert metadata to proper format
  // `metadata` is stored as `Json` in Prisma schema — treat as a generic object here.
  const metadata = pendingLibrarian.metadata as Record<string, unknown> | null;
        
        // Create new user with librarian role (omit metadata to avoid typing mismatch)
        await tx.user.create({
          data: {
            name: pendingLibrarian.name,
            email: pendingLibrarian.email,
            password: pendingLibrarian.password,
            role: UserRole.LIBRARIAN,
            isVerified: true,
          },
        });

        // Update request status
        await tx.pendingLibrarian.update({
          where: { id },
          data: { status: 'APPROVED' },
        });
      });

      // Send approval notification
      await this.mailerService.sendLibrarianApprovalNotification(
        pendingLibrarian.email,
        true
      );

      return { success: true, message: 'Librarian approved successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to approve librarian');
    }
  }

  @Patch(':id/reject')
  async rejectLibrarian(@Param('id') id: string) {
    const pendingLibrarian = await this.prisma.pendingLibrarian.findUnique({
      where: { id },
    });

    if (!pendingLibrarian) {
      throw new BadRequestException('Request not found');
    }

    try {
      // Update status to rejected
      await this.prisma.pendingLibrarian.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      // Send rejection notification
      await this.mailerService.sendLibrarianApprovalNotification(
        pendingLibrarian.email,
        false
      );

      return { success: true, message: 'Librarian request rejected' };
    } catch (error) {
      throw new BadRequestException('Failed to reject librarian request');
    }
  }
}
