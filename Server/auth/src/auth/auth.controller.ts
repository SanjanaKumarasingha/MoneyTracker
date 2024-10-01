import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
// import {signInDto} from './dto/signInDto'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @HttpCode(HttpStatus.OK)
    
    @Post('login')
    signIn (@Body() signInDto: Record<string, any>) {
        return this.authService.signIn(signInDto.username, signInDto.password);
    }

    @Post('register')
    signUp (@Body() signUpDto: Record<string, any>) {
        return this.authService.signUp(signUpDto.username, signUpDto.password);
    }

    @Post('validate')
    validateToken (@Body() token: Record<string, any>) {
        return this.authService.validateToken(token.token);
    }
}
