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
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { Wallet } from './entities/wallet.entity';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(
    @Body() createWalletDto: CreateWalletDto,
    @Request() req,
  ): Promise<Wallet> {
    // Validate the user
    const user = await this.usersService.findById(createWalletDto.userId);

    if (user.id !== req.user.id) {
      throw new UnauthorizedException('Unable to create wallet');
    }
    return await this.walletsService.create(createWalletDto, user);
  }

  @Get('/user/:id')
  async findAll(@Request() req, @Param('id') id: number) {
    const user = await this.usersService.findById(id);

    if (user.id !== req.user.id) {
      throw new UnauthorizedException('Unable to fetch wallet list');
    }

    return await this.walletsService.findAll(user.id);
  }

  // @Get(':id')
  // findOne(@Param('id') id: number) {
  //   return this.walletsService.findOne(+id);
  // }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateWalletDto: UpdateWalletDto,
    @Request() req,
  ) {
    // Check wallet is existing
    const wallet = await this.walletsService.findOne(id);
    if (!wallet) {
      throw new BadRequestException('Wallet does not exist.');
    }

    const user = await this.usersService.findById(req.user.id);

    if (!user) {
      throw new UnauthorizedException(
        'You have no access to update this wallet',
      );
    }

    return this.walletsService.update(+id, updateWalletDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    // Check wallet is existing
    const wallet = await this.walletsService.findOne(id);

    if (!wallet) {
      throw new BadRequestException('Wallet does not exist.');
    }

    return await this.walletsService.remove(wallet.id);
  }
}
