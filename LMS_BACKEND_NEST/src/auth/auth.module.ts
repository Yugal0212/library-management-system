import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../prisma.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { MailerService } from './mailer.service';
import { RolesGuard } from './guards/roles.guard';
import { TransactionService } from '../common/transaction.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerService, JwtAccessStrategy, JwtRefreshStrategy, RolesGuard, TransactionService],
  exports: [RolesGuard, MailerService, JwtAccessStrategy],
})
export class AuthModule {}

