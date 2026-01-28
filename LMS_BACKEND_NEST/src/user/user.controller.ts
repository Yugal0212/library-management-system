import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('create-patron')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async createPatron(@Body() createPatronDto: {
    name: string;
    email: string;
    password: string;
    role: 'STUDENT' | 'TEACHER';
    phone?: string;
    address?: string;
  }) {
    try {
      const user = await this.userService.create({
        ...createPatronDto,
        role: createPatronDto.role as UserRole
      });
      return { message: 'Patron created successfully', data: user };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  async findAll(@Query() filters?: { 
    role?: UserRole; 
    isActive?: boolean; 
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await this.userService.findAll(filters);
    return { message: 'Users fetched successfully', data: result.users };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: any) {
    return this.userService.findOne(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: any, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateProfile(user.sub, updateUserDto);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getUserStatistics() {
    return this.userService.getUserStatistics();
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getUserAnalytics() {
    return this.userService.getUserAnalytics();
  }

  @Post('bulk-action')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkUserAction(@Body() body: { userIds: string[]; action: 'activate' | 'deactivate' | 'delete' }) {
    return this.userService.bulkUserAction(body.userIds, body.action);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get(':id/borrowing-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  getBorrowingHistory(@Param('id') id: string) {
    return this.userService.getBorrowingHistory(id);
  }

  @Get(':id/current-loans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  getCurrentLoans(@Param('id') id: string) {
    return this.userService.getCurrentLoans(id);
  }

  @Get(':id/fines')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  getUserFines(@Param('id') id: string) {
    return this.userService.getUserFines(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  assignRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    return this.userService.assignRole(id, body.role);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  activateUser(@Param('id') id: string) {
    return this.userService.activateUser(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivateUser(@Param('id') id: string) {
    return this.userService.deactivateUser(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
