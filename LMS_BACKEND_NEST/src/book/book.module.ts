import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { PrismaModule } from '../../prisma.module';
import { TransactionService } from '../common/transaction.service';

@Module({
  imports: [PrismaModule],
  controllers: [BookController],
  providers: [BookService, TransactionService],
})
export class BookModule {}
