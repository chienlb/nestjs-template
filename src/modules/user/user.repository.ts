import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/postgre-sql/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user record
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /**
   * Find a user by their unique ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find a user by their unique email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Update user details by ID
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  /**
   * Fetch all users from database
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
}
