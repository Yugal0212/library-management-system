import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() dto: CreateReservationDto) {
    return this.reservationService.create(user.sub, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async findAll() {
    const reservations = await this.reservationService.findAll();
    return { message: 'All reservations fetched successfully', data: reservations };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyReservations(@CurrentUser() user: any) {
    const reservations = await this.reservationService.findByUser(user.sub);
    return { message: 'Your reservations fetched successfully', data: reservations };
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async approveReservation(@Param('id') id: string, @CurrentUser() user: any) {
    const reservation = await this.reservationService.approve(id, user.sub);
    return { message: 'Reservation approved successfully', data: reservation };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationService.cancel(id, user.sub);
  }
}
  