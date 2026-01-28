import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma.service';
import { TransactionService } from '../common/transaction.service';
import { ActivityType, UserRole } from '../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }
      });
      
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      // Hash the password before saving
      const passwordHash = await bcrypt.hash(createUserDto.password, 10);
      
      const userData = {
        ...createUserDto,
        password: passwordHash,
        isVerified: true, // Admin-created users are automatically verified
      };

      const user = await this.prisma.user.create({ 
        data: userData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password from response
        }
      });

      // Log user creation transaction
      await this.transactionService.logActivity(
        user.id,
        ActivityType.USER_ACTIVATED,
        `User account created by admin - Role: ${user.role}`
      );
      
      return user;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Email already exists');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(filters?: { 
    role?: UserRole; 
    isActive?: boolean; 
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ 
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
          _count: {
            select: {
              loans: true,
              fines: true,
              reservations: true
            }
          }
        }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserStatistics() {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentRegistrations
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
      recentRegistrations
    };
  }

  async getUserAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      usersByRole,
      monthlyGrowth,
      userActivity,
      verificationStats
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      this.prisma.loan.groupBy({
        by: ['userId'],
        _count: { userId: true },
        where: { loanDate: { gte: sixMonthsAgo } },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      this.prisma.user.groupBy({
        by: ['isVerified'],
        _count: { isVerified: true }
      })
    ]);

    // Calculate growth rate
    const sixMonthsUsersCount = await this.prisma.user.count({
      where: { createdAt: { gte: sixMonthsAgo } }
    });
    const growthRate = sixMonthsUsersCount > 0 ? ((monthlyGrowth / (sixMonthsUsersCount - monthlyGrowth)) * 100) : 0;

    return {
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        monthlyGrowth,
        growthRate: Math.round(growthRate * 100) / 100
      },
      distribution: {
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {} as Record<string, number>),
        byVerification: verificationStats.reduce((acc, item) => {
          acc[item.isVerified ? 'verified' : 'unverified'] = item._count.isVerified;
          return acc;
        }, {} as Record<string, number>)
      },
      activity: {
        mostActiveUsers: userActivity
      }
    };
  }

  async bulkUserAction(userIds: string[], action: 'activate' | 'deactivate' | 'delete') {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('No user IDs provided');
    }

    let result;
    
    switch (action) {
      case 'activate':
        result = await this.prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true }
        });
        
        // Log activity for each user
        for (const userId of userIds) {
          await this.transactionService.logActivity(
            userId,
            ActivityType.USER_ACTIVATED,
            'User activated via bulk action'
          );
        }
        break;
        
      case 'deactivate':
        result = await this.prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false }
        });
        
        // Log activity for each user
        for (const userId of userIds) {
          await this.transactionService.logActivity(
            userId,
            ActivityType.USER_SUSPENDED,
            'User deactivated via bulk action'
          );
        }
        break;
        
      case 'delete':
        // First check if any users have active loans
        const activeLoans = await this.prisma.loan.findMany({
          where: { 
            userId: { in: userIds },
            status: 'BORROWED'
          }
        });
        
        if (activeLoans.length > 0) {
          throw new BadRequestException('Cannot delete users with active loans');
        }
        
        // Log activity for each user before deletion
        for (const userId of userIds) {
          await this.transactionService.logActivity(
            userId,
            ActivityType.ADMIN_USER_CREATED, // Using closest available activity type
            'User deleted via bulk action'
          );
        }
        
        result = await this.prisma.user.deleteMany({
          where: { id: { in: userIds } }
        });
        break;
        
      default:
        throw new BadRequestException('Invalid action');
    }

    return {
      message: `Bulk ${action} completed successfully`,
      affectedUsers: result.count || userIds.length
    };
  }

  async getBorrowingHistory(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.loan.findMany({
      where: { userId },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            type: true,
            metadata: true
          }
        },
        fines: true
      },
      orderBy: { loanDate: 'desc' }
    });
  }

  async getCurrentLoans(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.loan.findMany({
      where: { 
        userId,
        status: 'BORROWED'
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            type: true,
            metadata: true
          }
        },
        fines: {
          where: { status: 'PENDING' }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async getUserFines(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.fine.findMany({
      where: { userId },
      include: {
        loan: {
          include: {
            item: {
              select: {
                id: true,
                title: true,
                type: true
              }
            }
          }
        },
        waivedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
        // Exclude sensitive fields like password
      }
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Prepare update data
      const updateData: any = { ...updateUserDto };

      // Hash password if it's being updated
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.user.update({ 
        where: { id }, 
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
          // Exclude sensitive fields like password
        }
      });
      
      return updatedUser;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error?.code === 'P2002') {
        throw new BadRequestException('Email already exists');
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update user');
    }
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Prepare update data (profile updates exclude role changes)
      const updateData: any = {};
      
      if (updateUserDto.name) updateData.name = updateUserDto.name;
      if (updateUserDto.email) updateData.email = updateUserDto.email;
      
      // Hash password if it's being updated
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.user.update({ 
        where: { id }, 
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          // Exclude sensitive fields
        }
      });

      // Log profile update transaction
      await this.transactionService.logActivity(
        id,
        ActivityType.PROFILE_UPDATED,
        `Profile updated by user`
      );
      
      return updatedUser;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error?.code === 'P2002') {
        throw new BadRequestException('Email already exists');
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update profile');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { message: 'User deleted successfully' };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new BadRequestException('Failed to delete user');
    }
  }

  async assignRole(userId: string, role: UserRole) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Log role change transaction
      await this.transactionService.logActivity(
        userId,
        ActivityType.ROLE_CHANGED,
        `Role changed from ${user.role} to ${role}`
      );

      return updatedUser;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign role');
    }
  }

  async activateUser(userId: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Log activation transaction
      await this.transactionService.logActivity(
        userId,
        ActivityType.USER_ACTIVATED,
        'User account activated by admin'
      );

      return user;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new BadRequestException('Failed to activate user');
    }
  }

  async deactivateUser(userId: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Log suspension transaction
      await this.transactionService.logActivity(
        userId,
        ActivityType.USER_SUSPENDED,
        'User account deactivated by admin'
      );

      return user;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new BadRequestException('Failed to deactivate user');
    }
  }
}
