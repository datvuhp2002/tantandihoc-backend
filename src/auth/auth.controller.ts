import { Body, Controller, Post } from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from './dto/registerUserDto.dto';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}
    @Post('register')
    register(@Body() body:RegisterUserDto ):Promise<User>{
        return this.authService.register(body)
    }
    @Post('login')
    login(@Body() body:LoginUserDto ):Promise<User>{
        return this.authService.login(body)
    }
    @Post('refresh_token')
    refreshToken(@Body() {refresh_token}):Promise<any>{
        return this.authService.refreshToken(refresh_token)
    }
}
