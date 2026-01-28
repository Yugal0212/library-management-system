import { IsDateString, IsEnum, IsString, MinLength, IsOptional, IsObject } from 'class-validator';
import { ItemType, Genre } from '../../common/enums';

export class CreateBookDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsEnum(ItemType)
  type: ItemType;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsObject()
  metadata: {
    author?: string;
    genre?: Genre;
    pages?: number;
    publisher?: string;
    edition?: string;
    [key: string]: any; // Allow additional metadata fields
  };
}
