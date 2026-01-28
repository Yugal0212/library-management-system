import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { PrismaModule } from '../../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ReservationModule } from '../reservation/reservation.module';
import { TransactionService } from '../common/transaction.service';

@Module({
  imports: [PrismaModule, AuthModule, ReservationModule],
  controllers: [LoanController],
  providers: [LoanService, TransactionService],
})
export class LoanModule {}

