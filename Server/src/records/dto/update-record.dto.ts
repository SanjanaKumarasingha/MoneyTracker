import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional } from 'class-validator';

// Deliberately not PartialType(CreateRecordDto) - CreateRecordDto's `wallet`/
// `category` fields are full entity objects (fine for create, where the
// controller already has them loaded) but here we only ever want to move a
// record to a *different* one of the user's own wallets/categories by id, so
// walletId/categoryId are plain numbers. Ownership of both is verified in
// RecordsController.update before this reaches the service.
export class UpdateRecordDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  price?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  remarks?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  // Reassigns the record to a different wallet - e.g. "I logged this
  // expense under the wrong wallet."
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  walletId?: number;

  // Reassigns the record to a different category.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
