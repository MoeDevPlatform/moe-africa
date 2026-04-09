// FILE: src/auth/auth.service.ts
// Add these two methods to your EXISTING auth service.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from '../users/dto/update-user-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // ... your existing login, register, refresh-token methods ...

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const data = Object.fromEntries(
      Object.entries(dto).filter(([_, v]) => v !== undefined),
    );

    if (Object.keys(data).length === 0) {
      return this.prisma.user.findUnique({ where: { id: userId } });
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    // Strip password from response
    const { password: _, ...result } = user as any;
    return result;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const hash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });

    return { message: 'Password updated successfully' };
  }
}
