import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CustomPrismaClient } from './src/types/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements CustomPrismaClient, OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✓ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
