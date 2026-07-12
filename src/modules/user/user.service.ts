import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Create a new user with password hashing and email uniqueness verification
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, password, name, role } = createUserDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'USER',
    });

    return this.sanitize(user);
  }

  /**
   * Find user by ID, throws NotFoundException if user is missing
   */
  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.sanitize(user);
  }

  /**
   * Find raw user by email (useful for auth services)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Update user info, hashes password if updated
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const data: Prisma.UserUpdateInput = { ...updateUserDto };

    // Ensure user exists
    await this.findById(id);

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userRepository.update(id, data);
    return this.sanitize(updatedUser);
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<Omit<User, 'password'>> {
    await this.findById(id);
    const deletedUser = await this.userRepository.delete(id);
    return this.sanitize(deletedUser);
  }

  /**
   * List all users
   */
  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.sanitize(user));
  }

  /**
   * Helper method to sanitize User output and remove sensitive password field
   */
  private sanitize(user: User): Omit<User, 'password'> {
    const sanitized = { ...user };
    delete (sanitized as Partial<User>).password;
    return sanitized;
  }
}
