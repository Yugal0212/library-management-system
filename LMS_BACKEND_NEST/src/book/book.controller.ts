import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateLibraryItemDto } from './dto/create-library-item.dto';
import { UpdateLibraryItemDto } from './dto/update-library-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ItemType, ItemStatus } from '../common/enums';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  // GET /book - Get all books (public as per features)
  @Get()
  async findAll(@Query() filters?: { 
    search?: string;
    type?: ItemType;
    category?: string;
    available?: boolean;
    isArchived?: string;
  }) {
    // Convert string query params to proper types
    const processedFilters = {
      ...filters,
      isArchived: filters?.isArchived === 'true' ? true : filters?.isArchived === 'false' ? false : undefined
    };
    
    const result = await this.bookService.findAll(processedFilters);
    // Return just the items array for frontend compatibility
    return result.items || result;
  }

  
  @Get('search/:q')
  search(@Param('q') query: string) {
    return this.bookService.search(query);
  }

  // GET /book/stats - Get book statistics (LIBRARIAN/ADMIN only)
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  getBookStats() {
    return this.bookService.getStats();
  }

  // GET /book/:id - Get book by ID (public as per features)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(id);
  }

  // POST /book - Create book (LIBRARIAN/ADMIN only as per features)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  create(
    @Body() createLibraryItemDto: CreateLibraryItemDto,
    @CurrentUser() user: any
  ) {
    return this.bookService.createItem(createLibraryItemDto, user.id);
  }

  // PATCH /book/:id - Update book (LIBRARIAN/ADMIN only as per features)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  update(
    @Param('id') id: string, 
    @Body() updateLibraryItemDto: UpdateLibraryItemDto,
    @CurrentUser() user: any
  ) {
    return this.bookService.update(id, updateLibraryItemDto);
  }

  // DELETE /book/:id - Archive book (LIBRARIAN/ADMIN only as per features)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookService.remove(id);
  }

  // DELETE /book/:id/permanent - Permanently delete book (ADMIN only)
  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  permanentDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookService.permanentDelete(id);
  }

  // PATCH /book/:id/unarchive - Unarchive book (LIBRARIAN/ADMIN only as per features)
  @Patch(':id/unarchive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  unarchive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookService.unarchive(id);
  }
}
