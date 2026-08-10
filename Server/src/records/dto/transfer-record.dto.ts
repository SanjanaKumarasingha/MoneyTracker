import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class TransferRecordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  fromWalletId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  toWalletId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  remarks?: string;
}
