import { Module } from '@nestjs/common';
import { LibrarianRequestsController } from './librarian-requests.controller';
import { PrismaService } from '../../prisma.service';
import { MailerService } from '../auth/mailer.service';

@Module({
  controllers: [LibrarianRequestsController],
  providers: [PrismaService, MailerService],
})
export class LibrarianRequestsModule {}
