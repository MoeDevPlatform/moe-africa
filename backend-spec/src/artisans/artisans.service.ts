// FILE: src/artisans/artisans.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateArtisanProfileDto } from './dto/update-artisan-profile.dto';

@Injectable()
export class ArtisansService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      include: { products: { take: 5, orderBy: { createdAt: 'desc' } } },
    });

    if (!profile) {
      throw new NotFoundException('Artisan profile not found.');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateArtisanProfileDto) {
    // Only include fields that were actually sent (not undefined)
    const data = Object.fromEntries(
      Object.entries(dto).filter(([_, v]) => v !== undefined),
    );

    if (Object.keys(data).length === 0) {
      return this.getProfile(userId);
    }

    return this.prisma.artisanProfile.update({
      where: { userId },
      data,
    });
  }
}
