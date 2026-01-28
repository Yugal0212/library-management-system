import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { MailerService } from '../auth/mailer.service';
import { ActivityType } from '../common/enums';

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async create(userId: string, dto: CreateReservationDto) {
    const { itemId } = dto;

    // Check if item exists and is not archived
    const item = await this.prisma.libraryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Book not found');
    if (item.isArchived) throw new BadRequestException('Book is archived');

    // Check if user already has a reservation for this item
    const existingReservation = await this.prisma.reservation.findFirst({
      where: { userId, itemId, isFulfilled: false },
    });
    if (existingReservation) throw new BadRequestException('You already have a reservation for this book');

    // Check if user already has this book borrowed
    const existingLoan = await this.prisma.loan.findFirst({
      where: { userId, itemId, returnDate: null },
    });
    if (existingLoan) throw new BadRequestException('You already have this book borrowed');

    // Set reservation expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        itemId,
        expiresAt,
      },
      include: {
        user: true,
        item: true,
      },
    });

    // Send email notification
    await this.mailer.sendReservationEmail(
      reservation.user.email,
      reservation.user.name,
      reservation.item.title,
      reservation.expiresAt,
    );

    // Log activity
    await this.prisma.transaction.create({
      data: {
        userId,
        action: 'RESERVATION_PLACED',
        details: `Reservation ${reservation.id} created for item ${itemId}`,
      },
    });

    return reservation;
  }

  async findAll() {
    const reservations = await this.prisma.reservation.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        item: { 
          select: { 
            id: true, 
            title: true, 
            status: true, 
            description: true,
            isbn: true,
            metadata: true,
            type: true,
            publishedAt: true,
            categories: {
              include: { category: true }
            }
          } 
        },
      },
      orderBy: { reservedAt: 'desc' },
    });

    // Flatten category data for each reservation item and rename item to libraryItem
    return reservations.map(reservation => {
      // Calculate status based on isFulfilled and expiry date
      let status = 'PENDING';
      if (reservation.isFulfilled) {
        status = 'FULFILLED';
      } else if (new Date() > new Date(reservation.expiresAt)) {
        status = 'EXPIRED';
      }

      return {
        ...reservation,
        status,
        createdAt: reservation.reservedAt, // Map reservedAt to createdAt for frontend compatibility
        expiryDate: reservation.expiresAt,  // Map expiresAt to expiryDate for frontend compatibility
        libraryItem: {
          ...reservation.item,
          author: (reservation.item.metadata as any)?.author || null,
          category: reservation.item.categories?.[0]?.category?.name || null,
        },
        // Remove the original item field since we're using libraryItem
        item: undefined
      };
    });
  }

  async findByUser(userId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { userId },
      include: {
        item: { 
          select: { 
            id: true, 
            title: true, 
            status: true, 
            description: true,
            isbn: true,
            metadata: true,
            type: true,
            publishedAt: true,
            categories: {
              include: { category: true }
            }
          } 
        },
      },
      orderBy: { reservedAt: 'desc' },
    });

    // Flatten category data for each reservation item and rename item to libraryItem
    return reservations.map(reservation => {
      // Calculate status based on isFulfilled and expiry date
      let status = 'PENDING';
      if (reservation.isFulfilled) {
        status = 'FULFILLED';
      } else if (new Date() > new Date(reservation.expiresAt)) {
        status = 'EXPIRED';
      }

      return {
        ...reservation,
        status,
        createdAt: reservation.reservedAt, // Map reservedAt to createdAt for frontend compatibility
        expiryDate: reservation.expiresAt,  // Map expiresAt to expiryDate for frontend compatibility
        libraryItem: {
          ...reservation.item,
          author: (reservation.item.metadata as any)?.author || null,
          category: reservation.item.categories?.[0]?.category?.name || null,
        },
        // Remove the original item field since we're using libraryItem
        item: undefined
      };
    });
  }

  async approve(reservationId: string, librarianId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: true, item: true },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.isFulfilled) throw new BadRequestException('Reservation already processed');
    
    // Check if item is still available
    if (reservation.item.status !== 'AVAILABLE') {
      throw new BadRequestException('Item is no longer available');
    }

    // Create a loan for the approved reservation
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period

    const loan = await this.prisma.$transaction(async (tx) => {
      // Create the loan
      const newLoan = await tx.loan.create({
        data: {
          userId: reservation.userId,
          itemId: reservation.itemId,
          loanDate: new Date(),
          dueDate: dueDate,
        },
      });

      // Update item status to borrowed
      await tx.libraryItem.update({
        where: { id: reservation.itemId },
        data: { status: 'BORROWED' },
      });

      // Mark reservation as fulfilled
      await tx.reservation.update({
        where: { id: reservationId },
        data: { isFulfilled: true },
      });

      return newLoan;
    });

    // Send approval email
    await this.mailer.sendReservationAvailableEmail(
      reservation.user.email,
      reservation.user.name,
      reservation.item.title,
    );

    // Log activity
    await this.prisma.transaction.create({
      data: {
        userId: librarianId,
        action: ActivityType.RESERVATION_APPROVED,
        details: `Reservation ${reservationId} approved and loan ${loan.id} created for user ${reservation.userId}`,
      },
    });

    return loan;
  }

  async cancel(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: true, item: true },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.userId !== userId) throw new BadRequestException('You can only cancel your own reservations');
    if (reservation.isFulfilled) throw new BadRequestException('Cannot cancel a fulfilled reservation');

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { isFulfilled: true }, // Mark as cancelled by setting fulfilled
    });

    // Send cancellation email
    await this.mailer.sendReservationCancellationEmail(
      reservation.user.email,
      reservation.user.name,
      reservation.item.title,
    );

    // Log activity
    await this.prisma.transaction.create({
      data: {
        userId,
        action: 'RESERVATION_CANCELLED',
        details: `Reservation ${reservationId} cancelled`,
      },
    });

    return { message: 'Reservation cancelled successfully' };
  }

  async checkAndFulfillReservations(itemId: string) {
    // When a book is returned, check if there are pending reservations
    const pendingReservations = await this.prisma.reservation.findMany({
      where: {
        itemId,
        isFulfilled: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true, item: true },
      orderBy: { reservedAt: 'asc' }, // First come, first served
    });

    if (pendingReservations.length > 0) {
      const nextReservation = pendingReservations[0];
      
      // Send notification to the next person in queue
      await this.mailer.sendReservationAvailableEmail(
        nextReservation.user.email,
        nextReservation.user.name,
        nextReservation.item.title,
      );
    }
  }
}
