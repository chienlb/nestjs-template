import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The password of the user (min length 6)',
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'The display name of the user',
  })
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi' })
  name?: string;

  @ApiPropertyOptional({
    example: 'USER',
    description: 'The role of the user',
    default: 'USER',
  })
  @IsOptional()
  @IsString({ message: 'Role phải là chuỗi' })
  role?: string;
}
