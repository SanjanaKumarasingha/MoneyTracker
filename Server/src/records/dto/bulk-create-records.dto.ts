import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

// One imported spreadsheet row, already mapped/edited/reconciled on the
// client (column mapping, blank-date carry-forward, "Rs1,234"-style amount
// parsing, category reconciliation all happen client-side - see
// Client/src/pages/ImportPage.tsx) - by the time this DTO is hit, every row
// is just a plain record waiting to be created.
export class BulkCreateRecordRowDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  remarks?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;
}

export class BulkCreateRecordsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  walletId: number;

  @ApiProperty({ type: () => [BulkCreateRecordRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => BulkCreateRecordRowDto)
  rows: BulkCreateRecordRowDto[];
}
