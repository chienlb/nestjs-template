import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
  ApiPropertyOptional,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { UserService } from '../user/user.service';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import type { Request } from 'express';

class LoginDto {
  @ApiProperty({ example: 'test@example.com', description: 'User Email' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: '123456', description: 'User Password' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  password: string;
}

class SendOtpDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'Email address to send OTP to',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

class ResetPasswordDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code received via email',
  })
  @IsString({ message: 'Mã OTP phải là chuỗi' })
  otp: string;

  @ApiProperty({ example: 'newpassword123', description: 'New password' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu mới phải từ 6 ký tự trở lên' })
  newPassword: string;
}

class ChangePasswordDto {
  @ApiProperty({ example: '123456', description: 'Old password of the user' })
  @IsString({ message: 'Mật khẩu cũ phải là chuỗi' })
  oldPassword: string;

  @ApiProperty({ example: 'newpassword123', description: 'New password' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu mới phải từ 6 ký tự trở lên' })
  newPassword: string;
}

class LogoutDto {
  @ApiPropertyOptional({
    example: 'fcm-device-token-abc',
    description: 'Optional FCM token to unregister',
  })
  @IsOptional()
  @IsString({ message: 'Device token phải là chuỗi' })
  deviceToken?: string;
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

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send an OTP code to a user's email" })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    await this.authService.sendOtp(sendOtpDto.email);
    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using an OTP code' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );
    return {
      message: 'Mật khẩu đã được đặt lại thành công',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for currently logged-in user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Incorrect old password' })
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.id;
    await this.authService.changePassword(
      userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
    return {
      message: 'Mật khẩu đã được thay đổi thành công',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out user and optionally clear push token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: RequestWithUser, @Body() logoutDto: LogoutDto) {
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const rawUserAgent = req.headers['user-agent'];
    const userAgent =
      typeof rawUserAgent === 'string' ? rawUserAgent : undefined;

    await this.authService.logout(
      userId,
      logoutDto.deviceToken,
      ipAddress,
      userAgent,
    );

    return {
      message: 'Đăng xuất thành công',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.userService.findById(userId);
  }
}
