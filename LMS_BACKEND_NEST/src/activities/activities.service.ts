import { Injectable } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createActivityDto: CreateActivityDto, userId?: string) {
    const data = userId 
      ? { ...createActivityDto, userId, action: createActivityDto.action as any }
      : { ...createActivityDto, action: createActivityDto.action as any };
    return this.prisma.transaction.create({ data });
  }

  findAll(params?: { userId?: string; action?: string; from?: Date; to?: Date }) {
    const { userId, action, from, to } = params ?? {};
    return this.prisma.transaction.findMany({
      where: {
        userId: userId ?? undefined,
        action: (action as any) ?? undefined,
        createdAt: from || to ? { gte: from ?? undefined, lte: to ?? undefined } : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
