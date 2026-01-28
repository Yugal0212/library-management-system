import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PrismaModule } from '../../prisma.module';
import { TransactionService } from '../common/transaction.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, TransactionService],
})
export class ActivitiesModule {}
  