import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ActivityType } from '../../common/enums';

export class CreateActivityDto {
  @IsString()
  userId: string;

  @IsEnum(ActivityType)
  action: ActivityType;

  @IsOptional()
  @IsString()
  details?: string;
}
