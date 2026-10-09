import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Throttle first, so rate-limited attempts never reach the password check
  // (10 attempts per minute per IP - see ThrottlerModule in app.module.ts).
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Post('login')
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  async login(@Body() loginDto: LoginDto, @Request() req) {
    // Return the access token
    // console.log('loginDto', loginDto);
    // console.log('req.user', req.user);

    return this.authService.login(req.user);
  }
}
