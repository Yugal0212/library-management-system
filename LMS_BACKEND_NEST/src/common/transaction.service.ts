import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ActivityType } from '../common/enums';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async logActivity(
    userId: string,
    action: ActivityType,
    details?: string,
  ) {
    try {
      return await this.prisma.transaction.create({
        data: {
          userId,
          action: action as any,
          details,
        },
      });
    } catch (error) {
      // Log error but don't throw to avoid breaking main operations
      console.error('Failed to log transaction:', error);
    }
  }

  async getUserActivities(userId: string, limit = 50) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getAllActivities(limit = 100) {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getActivityStats(userId?: string) {
    const where = userId ? { userId } : {};
    
    const totalActivities = await this.prisma.transaction.count({ where });
    
    const actionCounts = await this.prisma.transaction.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
    });

    return {
      totalActivities,
      actionBreakdown: actionCounts.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
    };
  }
}
