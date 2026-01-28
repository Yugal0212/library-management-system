import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLoanDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  itemId: string;

  @IsOptional()
  @IsDateString()
  loanDate?: string;


  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  renewalCount?: number;
}

