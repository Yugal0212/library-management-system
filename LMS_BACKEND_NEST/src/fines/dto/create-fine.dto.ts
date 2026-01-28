import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFineDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  loanId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
