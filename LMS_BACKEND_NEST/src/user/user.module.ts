import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../../prisma.module';
import { TransactionService } from '../common/transaction.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, TransactionService],
})
export class UserModule {}
