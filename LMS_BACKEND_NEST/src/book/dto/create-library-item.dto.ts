import { IsDateString, IsEnum, IsString, MinLength, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ItemType } from '../../common/enums';

export class CreateLibraryItemDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  title: string;

  @IsEnum(ItemType)
  @IsNotEmpty()
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
  @IsNotEmpty()
  metadata: Record<string, any>;
}
