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
  BadRequestException,
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
      throw new UnauthorizedException('Unable to create category');
    }
    return this.recordsService.create(createRecordDto);
  }

  @Get('/wallet/:id')
  async findAll(@Param('id') id: number) {
    const wallet = await this.walletsService.findOne(id);

    if (!wallet) {
      throw new BadRequestException('Wallet does not exist');
    }

    return await this.recordsService.findAll(wallet);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.recordsService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateRecordDto: UpdateRecordDto,
  ) {
    const record = await this.recordsService.findOne(id);

    if (!record) {
      throw new BadRequestException('Record does not exist');
    }

    return await this.recordsService.update(+id, updateRecordDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.recordsService.remove(+id);
  }

  @Get('/category/:categoryId/remarks')
  async getRemarks(@Param('categoryId') categoryId: number) {
    // Get all the remarks of that category
    const category = await this.categoriesService.findOne(categoryId);

    if (!category) {
      throw new BadRequestException('The category does not exist');
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
