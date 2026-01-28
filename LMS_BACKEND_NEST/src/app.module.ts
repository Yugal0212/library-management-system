import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma.module';
import { UserModule } from './user/user.module';
import { BookModule } from './book/book.module';
import { ActivitiesModule } from './activities/activities.module';
import { LoanModule } from './loan/loan.module';
import { AuthModule } from './auth/auth.module';
import { ReservationModule } from './reservation/reservation.module';
import { FinesModule } from './fines/fines.module';
import { LibrarianRequestsModule } from './librarian-requests/librarian-requests.module';

@Module({
  imports: [
    PrismaModule,
    UserModule, 
    BookModule, 
  
    ActivitiesModule, 
    LoanModule, 
    AuthModule,
    ReservationModule,
    FinesModule,
    LibrarianRequestsModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
