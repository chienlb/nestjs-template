import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { UserService } from '../user/user.service';
import type { Request } from 'express';

class LoginDto {
  @ApiProperty({ example: 'test@example.com', description: 'User Email' })
  email: string;

  @ApiProperty({ example: '123456', description: 'User Password' })
  password: string;
}

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user credentials' })
  @ApiResponse({ status: 201, description: 'JWT authentication token' })
  async login(@Body() loginDto: LoginDto) {
    const credentials = {
      email: loginDto.email,
      password: loginDto.password,
    };
    return this.authService.login(credentials);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve logged-in user profile' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  async getMe(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.userService.findById(userId);
  }
}
