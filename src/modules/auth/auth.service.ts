import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { signJwt } from '../../common/utils/token.util';
import { CreateUserDto } from '../user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
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
}
