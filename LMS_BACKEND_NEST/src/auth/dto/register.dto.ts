import { IsEmail, IsString, MinLength, IsEnum, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/enums';

class LibrarianMetadata {
  @IsString()
  libraryId: string;

  @IsString()
  department: string;

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

class PatronMetadata {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LibrarianMetadata, {
    discriminator: {
      property: 'role',
      subTypes: [
        { value: LibrarianMetadata, name: 'LIBRARIAN' },
        { value: PatronMetadata, name: 'STUDENT' }
      ]
    }
  })
  metadata?: LibrarianMetadata | PatronMetadata;
}

