import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateLibraryItemDto } from './dto/create-library-item.dto';
import { UpdateLibraryItemDto } from './dto/update-library-item.dto';
import { CreateBookSpecificDto, CreateDVDDto, CreateEquipmentDto } from './dto/create-specific-items.dto';
import { PrismaService } from '../../prisma.service';
import { TransactionService } from '../common/transaction.service';
import { randomUUID } from 'crypto';
import { ItemType, ActivityType, ItemStatus } from '../common/enums';

@Injectable()
export class BookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
  ) {}

  // Generic item creation
  async createItem(createItemDto: CreateLibraryItemDto, userId?: string) {
    try {
      console.log('Creating item with data:', createItemDto);
      const uniqueItemId = randomUUID();
      
      // Convert publishedAt to proper DateTime format if provided
      const data = { ...createItemDto };
      if (data.publishedAt) {
        // If it's just a date, convert to ISO DateTime
        if (!data.publishedAt.includes('T')) {
          data.publishedAt = `${data.publishedAt}T00:00:00.000Z`;
        }
      }
      
      // Remove undefined values to avoid Prisma issues
      Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
          delete data[key];
        }
      });
      
      console.log('Processed data for Prisma:', data);
      
      const created = await this.prisma.libraryItem.create({ 
        data: { 
          uniqueItemId, 
          ...data 
        },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });

      // Log transaction if userId is provided
      if (userId) {
        await this.transactionService.logActivity(
          userId,
          ActivityType.ITEM_ADDED,
          `Added ${created.type}: "${created.title}" (ID: ${created.id})`
        );
      }

      return created;
    } catch (error: any) {
      console.error('Error creating library item:', error);
      throw new BadRequestException(`Failed to create library item: ${error.message}`);
    }
  }

  // Specific item type creation methods
  async createBook(createBookDto: CreateBookSpecificDto, userId?: string) {
    const itemData: CreateLibraryItemDto = {
      title: createBookDto.title,
      type: ItemType.BOOK,
      publishedAt: createBookDto.publishedAt,
      description: createBookDto.description,
      isbn: createBookDto.isbn,
      barcode: createBookDto.barcode,
      language: createBookDto.language || 'English',
      location: createBookDto.location,
      metadata: {
        author: createBookDto.author,
        genre: createBookDto.genre,
        publisher: createBookDto.publisher,
        pages: createBookDto.pages,
        edition: createBookDto.edition,
      }
    };
    return this.createItem(itemData, userId);
  }

  async createDVD(createDVDDto: CreateDVDDto, userId?: string) {
    const itemData: CreateLibraryItemDto = {
      title: createDVDDto.title,
      type: ItemType.DVD,
      description: createDVDDto.description,
      barcode: createDVDDto.barcode,
      language: createDVDDto.language || 'English',
      location: createDVDDto.location,
      metadata: {
        director: createDVDDto.director,
        duration: createDVDDto.duration,
        rating: createDVDDto.rating,
        year: createDVDDto.year,
        actors: createDVDDto.actors,
        genre: createDVDDto.genre,
      }
    };
    return this.createItem(itemData, userId);
  }

  async createEquipment(createEquipmentDto: CreateEquipmentDto, userId?: string) {
    const itemData: CreateLibraryItemDto = {
      title: createEquipmentDto.title,
      type: ItemType.EQUIPMENT,
      description: createEquipmentDto.description,
      barcode: createEquipmentDto.barcode,
      location: createEquipmentDto.location,
      metadata: {
        brand: createEquipmentDto.brand,
        model: createEquipmentDto.model,
        serialNumber: createEquipmentDto.serialNumber,
        specifications: createEquipmentDto.specifications,
        condition: createEquipmentDto.condition,
      }
    };
    return this.createItem(itemData, userId);
  }

  // Enhanced findAll method with comprehensive filtering
  async findAll(filters?: { 
    search?: string;
    type?: ItemType;
    status?: any;
    category?: string;
    isAvailable?: boolean;
    isArchived?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { isbn: { contains: filters.search, mode: 'insensitive' } },
        { metadata: { path: ['author'], string_contains: filters.search } },
        { metadata: { path: ['director'], string_contains: filters.search } },
      ];
    }

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.isArchived !== undefined) where.isArchived = filters.isArchived;

    if (filters?.category) {
      where.categories = {
        some: {
          category: {
            name: { contains: filters.category, mode: 'insensitive' }
          }
        }
      };
    }

    if (filters?.isAvailable !== undefined) {
      where.status = filters.isAvailable ? 'AVAILABLE' : { not: 'AVAILABLE' };
    }

    const orderBy: any = {};
    if (filters?.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.libraryItem.findMany({
        where,
        include: {
          categories: {
            include: { category: true }
          },
          loans: {
            where: { returnDate: null },
            select: { id: true, dueDate: true }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.libraryItem.count({ where })
    ]);

    // Add computed fields with safe type casting
    const enhancedItems = items.map(item => {
      const metadata = item.metadata as any || {};
      const totalCopies = metadata.totalCopies || 1;
      const activeLoanCount = item.loans?.length || 0;
      const availableCopies = Math.max(0, totalCopies - activeLoanCount);
      
      return {
        ...item,
        isAvailable: availableCopies > 0 && item.status === 'AVAILABLE',
        availableCopies,
        totalCopies,
        author: metadata.author || null,
        director: metadata.director || null,
        brand: metadata.brand || null,
        manufacturer: metadata.brand || null, // For backward compatibility
        genre: metadata.genre || null,
        publisher: metadata.publisher || null,
        pages: metadata.pages || null,
        publishedYear: item.publishedAt ? new Date(item.publishedAt).getFullYear() : null,
        category: metadata.category || item.categories?.[0]?.category?.name || null, // Use metadata category first, then flatten first category for UI compatibility
      };
    });

    return {
      items: enhancedItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async search(query: string) {
    return this.findAll({ search: query, limit: 50 });
  }

  async findOne(id: string) {
    const item = await this.prisma.libraryItem.findUnique({ 
      where: { id },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        loans: {
          where: { returnDate: null },
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });
    if (!item) {
      throw new NotFoundException('Library item not found');
    }
    
    // Add computed fields
    const metadata = item.metadata as any || {};
    const totalCopies = metadata.totalCopies || 1;
    const activeLoanCount = item.loans?.length || 0;
    const availableCopies = Math.max(0, totalCopies - activeLoanCount);
    
    return {
      ...item,
      isAvailable: availableCopies > 0 && item.status === 'AVAILABLE',
      availableCopies,
      totalCopies,
      author: metadata.author || null,
      director: metadata.director || null,
      brand: metadata.brand || null,
      manufacturer: metadata.brand || null, // For backward compatibility
      genre: metadata.genre || null,
      publisher: metadata.publisher || null,
      pages: metadata.pages || null,
      publishedYear: item.publishedAt ? new Date(item.publishedAt).getFullYear() : null,
      category: metadata.category || item.categories?.[0]?.category?.name || null, // Use metadata category first, then flatten first category for UI compatibility
    };
  } 

  async update(id: string, updateItemDto: UpdateLibraryItemDto) {
    try {
      // Convert publishedAt to proper DateTime format if provided
      const data = { ...updateItemDto };
      if (data.publishedAt) {
        // If it's just a date, convert to ISO DateTime
        if (!data.publishedAt.includes('T')) {
          data.publishedAt = `${data.publishedAt}T00:00:00.000Z`;
        }
      }
      
      // Remove undefined values to avoid Prisma issues
      Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
          delete data[key];
        }
      });
      
      console.log('Updating item with data:', data);
      
      return await this.prisma.libraryItem.update({ 
        where: { id }, 
        data,
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });
    } catch (error: any) {
      console.error('Error updating library item:', error);
      if (error?.code === 'P2025') {
        throw new NotFoundException('Library item not found');
      }
      throw new BadRequestException(`Failed to update library item: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      // Guard: prevent deleting if currently borrowed; otherwise archive
      const item = await this.prisma.libraryItem.findUnique({ where: { id } });
      if (!item) {
        throw new NotFoundException('Library item not found');
      }
      if (item.status === 'BORROWED') {
        throw new BadRequestException('Cannot delete a borrowed item');
      }

      await this.prisma.libraryItem.update({ where: { id }, data: { isArchived: true } });
      return { message: 'Library item archived successfully' };
    } catch (error: any) {
      console.error('Error in remove method:', error);
      if (error?.code === 'P2025') {
        throw new NotFoundException('Library item not found');
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to archive library item: ${error.message}`);
    }
  }

  async unarchive(id: string) {
    try {
      const item = await this.prisma.libraryItem.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Library item not found');
      if (!item.isArchived) return { message: 'Library item is already active' };

      await this.prisma.libraryItem.update({ where: { id }, data: { isArchived: false } });
      return { message: 'Library item unarchived successfully' };
    } catch (error: any) {
      console.error('Error in unarchive method:', error);
      if (error?.code === 'P2025') throw new NotFoundException('Library item not found');
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to unarchive library item: ${error.message}`);
    }
  }

  async getStats() {
    try {
      const [
        total,
        available,
        borrowed,
        archived,
        byType,
        recentlyAdded
      ] = await Promise.all([
        this.prisma.libraryItem.count(),
        this.prisma.libraryItem.count({ where: { status: 'AVAILABLE', isArchived: false } }),
        this.prisma.libraryItem.count({ where: { status: 'BORROWED' } }),
        this.prisma.libraryItem.count({ where: { isArchived: true } }),
        this.prisma.libraryItem.groupBy({
          by: ['type'],
          _count: { type: true },
          where: { isArchived: false }
        }),
        this.prisma.libraryItem.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            isArchived: false
          }
        })
      ]);

      return {
        total,
        available,
        borrowed,
        archived,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        recentlyAdded
      };
    } catch (error) {
      throw new BadRequestException('Failed to get book statistics');
    }
  }

  async permanentDelete(id: string) {
    try {
      // Check if item exists and if it has any active loans
      const item = await this.prisma.libraryItem.findUnique({
        where: { id },
        include: {
          loans: {
            where: { status: 'BORROWED' }
          }
        }
      });

      if (!item) {
        throw new NotFoundException('Library item not found');
      }

      if (item.loans && item.loans.length > 0) {
        throw new BadRequestException('Cannot permanently delete an item with active loans');
      }

      // Delete all related records first
      await this.prisma.$transaction([
        // Delete loan history
        this.prisma.loan.deleteMany({ where: { itemId: id } }),
        // Delete reservations
        this.prisma.reservation.deleteMany({ where: { itemId: id } }),
        // Delete category associations
        this.prisma.itemCategory.deleteMany({ where: { itemId: id } }),
        // Finally delete the item
        this.prisma.libraryItem.delete({ where: { id } })
      ]);

      return { message: 'Library item permanently deleted successfully' };
    } catch (error: any) {
      console.error('Error in permanentDelete method:', error);
      if (error?.code === 'P2025') {
        throw new NotFoundException('Library item not found');
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to permanently delete library item: ${error.message}`);
    }
  }

  async getStatistics() {
    const [
      totalItems,
      itemsByType,
      itemsByStatus,
      overdueCount,
      recentlyAdded
    ] = await Promise.all([
      this.prisma.libraryItem.count({ where: { isArchived: false } }),
      this.prisma.libraryItem.groupBy({
        by: ['type'],
        where: { isArchived: false },
        _count: { type: true }
      }),
      this.prisma.libraryItem.groupBy({
        by: ['status'],
        where: { isArchived: false },
        _count: { status: true }
      }),
      this.prisma.loan.count({
        where: {
          status: 'BORROWED',
          dueDate: { lt: new Date() }
        }
      }),
      this.prisma.libraryItem.count({
        where: {
          isArchived: false,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    return {
      totalItems,
      itemsByType: itemsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      itemsByStatus: itemsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      overdueCount,
      recentlyAdded
    };
  }

  async getOverdueItems() {
    return this.prisma.loan.findMany({
      where: {
        status: 'BORROWED',
        dueDate: { lt: new Date() }
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            type: true,
            barcode: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async findByBarcode(barcode: string) {
    const item = await this.prisma.libraryItem.findUnique({
      where: { barcode },
      include: {
        categories: {
          include: { category: true }
        },
        loans: {
          where: { returnDate: null },
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

    if (!item) {
      throw new NotFoundException('Item not found with this barcode');
    }

    return item;
  }

  async updateStatus(id: string, status: ItemStatus) {
    try {
      const item = await this.prisma.libraryItem.update({
        where: { id },
        data: { status },
        include: {
          categories: {
            include: { category: true }
          }
        }
      });

      return item;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Library item not found');
      }
      throw new BadRequestException('Failed to update item status');
    }
  }

  async toggleArchive(id: string) {
    try {
      const item = await this.prisma.libraryItem.findUnique({ where: { id } });
      if (!item) {
        throw new NotFoundException('Library item not found');
      }

      const updated = await this.prisma.libraryItem.update({
        where: { id },
        data: { isArchived: !item.isArchived },
        include: {
          categories: {
            include: { category: true }
          }
        }
      });

      return {
        ...updated,
        message: `Item ${updated.isArchived ? 'archived' : 'unarchived'} successfully`
      };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Library item not found');
      }
      throw new BadRequestException('Failed to toggle archive status');
    }
  }

  // Inventory Management Methods
  async startInventoryAudit() {
    const allItems = await this.prisma.libraryItem.findMany({
      where: { isArchived: false },
      select: {
        id: true,
        title: true,
        type: true,
        barcode: true,
        status: true
      }
    });

    return {
      message: 'Inventory audit started',
      itemsToAudit: allItems.length,
      items: allItems
    };
  }

  async getMissingItems() {
    return this.prisma.libraryItem.findMany({
      where: {
        status: 'LOST',
        isArchived: false
      },
      include: {
        categories: {
          include: { category: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getDamagedItems() {
    return this.prisma.libraryItem.findMany({
      where: {
        status: 'DAMAGED',
        isArchived: false
      },
      include: {
        categories: {
          include: { category: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
