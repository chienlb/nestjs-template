import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { signJwt, generateNumericOTP } from '../../common/utils/token.util';
import { CreateUserDto } from '../user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../../database/redis/redis.service';
import { FcmService } from '../fcm/fcm.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly fcmService: FcmService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Register a new user
   */
  async register(createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * Log in user and generate JWT token
   */
  async login(loginDto: Record<string, string>) {
    const { email, password } = loginDto;
    if (!email || !password) {
      throw new UnauthorizedException('Email và mật khẩu là bắt buộc');
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const jwtSecret =
      this.configService.get<string>('jwt.secret') || 'defaultSecret';
    const jwtExpiresIn =
      this.configService.get<string>('jwt.expiresIn') || '1d';

    const token = signJwt(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn as unknown as number },
    );

    const sanitizedUser = { ...user } as Partial<typeof user>;
    delete sanitizedUser.password;

    return {
      user: sanitizedUser,
      token,
    };
  }

  /**
   * Send OTP code to user's email
   */
  async sendOtp(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng với email này');
    }

    const otpCode = generateNumericOTP(6);

    // Save OTP to Redis for 5 minutes (300 seconds)
    await this.redisService.set(`otp:${email}`, otpCode, 300);

    // Send email
    await this.mailService.sendMail({
      to: email,
      subject: 'Mã xác thực OTP của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px; max-width: 500px;">
          <h2 style="color: #007bff;">Mã xác thực OTP</h2>
          <p>Xin chào ${user.name || 'bạn'},</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
          <div style="font-size: 24px; font-weight: bold; background-color: #f8f9fa; padding: 10px 20px; border-radius: 5px; text-align: center; color: #333; margin: 20px 0; border: 1px dashed #ccc;">
            ${otpCode}
          </div>
          <p style="color: #666; font-size: 14px;">Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        </div>
      `,
    });

    // Write audit log
    void this.auditLogService.log(user.id, 'SEND_OTP', { email });
  }

  /**
   * Reset user password using OTP
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    const storedOtp = await this.redisService.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Mã OTP không chính xác hoặc đã hết hạn');
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Update password (hashing is handled inside userService.update)
    await this.userService.update(user.id, { password: newPassword });

    // Clean up OTP from Redis
    await this.redisService.del(`otp:${email}`);

    // Write audit log
    void this.auditLogService.log(user.id, 'RESET_PASSWORD_SUCCESS', { email });
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userService.findRawById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    // Update password (hashing is handled inside userService.update)
    await this.userService.update(userId, { password: newPassword });

    // Write audit log
    void this.auditLogService.log(userId, 'CHANGE_PASSWORD_SUCCESS', {});
  }

  /**
   * Log out user
   */
  async logout(
    userId: string,
    deviceToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    if (deviceToken) {
      await this.fcmService.removeDevice(deviceToken);
    }

    // Write audit log
    void this.auditLogService.log(
      userId,
      'USER_LOGOUT',
      { deviceTokenDeleted: !!deviceToken },
      { ipAddress, userAgent },
    );
  }
}
