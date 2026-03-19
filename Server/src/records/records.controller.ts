import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ClassSerializerInterceptor,
  UseGuards,
  UseInterceptors,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { CategoriesService } from '../categories/categories.service';

@ApiTags('Record')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('records')
export class RecordsController {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Post()
  async create(@Body() createRecordDto: CreateRecordDto, @Request() req) {
    // Validate the user
    const user = await this.usersService.findById(req.user.id);

    if (!user) {
      throw new UnauthorizedException('Unable to create record');
    }

    const wallet = await this.walletsService.findOneForUser(
      createRecordDto.wallet.id,
      req.user.id,
    );

    const category = await this.categoriesService.findOneForUser(
      createRecordDto.category.id,
      req.user.id,
    );

    if (!wallet || !category) {
      throw new UnauthorizedException('Unable to create record');
    }

    if (category.wallet?.id !== wallet.id) {
      throw new UnauthorizedException(
        'Selected category does not belong to this wallet',
      );
    }

    return this.recordsService.create({
      ...createRecordDto,
      wallet,
      category,
    });
  }

  @Get('/wallet/:id')
  async findAll(@Param('id') id: number, @Request() req) {
    const wallet = await this.walletsService.findOneForUser(+id, req.user.id);

    if (!wallet) {
      throw new UnauthorizedException('You have no access to this wallet');
    }

    return await this.recordsService.findAll(wallet);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Request() req) {
    const record = await this.recordsService.findOneForUser(+id, req.user.id);

    if (!record) {
      throw new UnauthorizedException('You have no access to this record');
    }

    return record;
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateRecordDto: UpdateRecordDto,
    @Request() req,
  ) {
    const record = await this.recordsService.findOneForUser(+id, req.user.id);

    if (!record) {
      throw new UnauthorizedException(
        'You have no access to update this record',
      );
    }

    return await this.recordsService.update(+id, updateRecordDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    const record = await this.recordsService.findOneForUser(+id, req.user.id);

    if (!record) {
      throw new UnauthorizedException(
        'You have no access to delete this record',
      );
    }

    return await this.recordsService.remove(+id);
  }

  @Get('/category/:categoryId/remarks')
  async getRemarks(@Param('categoryId') categoryId: number, @Request() req) {
    const category = await this.categoriesService.findOneForUser(
      +categoryId,
      req.user.id,
    );

    if (!category) {
      throw new UnauthorizedException('You have no access to this category');
    }

    const records = await this.recordsService.getRemarks(category);
    return records.reduce((remarks: string[], record) => {
      if (
        record.remarks &&
        !remarks.find((remark) => remark === record.remarks)
      ) {
        remarks.push(record.remarks);
      }
      return remarks;
    }, []);
  }
}
