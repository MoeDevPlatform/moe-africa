// FILE: src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(userId: string, dto: CreateProductDto) {
    // Find the artisan profile linked to this user
    const artisan = await this.prisma.artisanProfile.findUnique({
      where: { userId },
    });

    if (!artisan) {
      throw new ForbiddenException(
        'You must have an artisan profile to create products.',
      );
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        priceMin: dto.priceMin,
        priceMax: dto.priceMax,
        currency: dto.currency ?? 'NGN',
        materials: dto.materials ?? null,
        estimatedDeliveryDays: dto.estimatedDeliveryDays ?? null,
        images: dto.images ?? [],
        tags: dto.tags ?? [],
        artisan: { connect: { id: artisan.id } },
      },
    });
  }

  async getProductsByArtisan(userId: string, page = 1, pageSize = 20) {
    const artisan = await this.prisma.artisanProfile.findUnique({
      where: { userId },
    });

    if (!artisan) {
      return { data: [], pagination: { page, pageSize, totalPages: 0, totalItems: 0 } };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { artisanId: artisan.id },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { artisanId: artisan.id } }),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        totalItems: total,
      },
    };
  }

  async deleteProduct(userId: string, productId: string) {
    const artisan = await this.prisma.artisanProfile.findUnique({
      where: { userId },
    });

    if (!artisan) {
      throw new ForbiddenException('No artisan profile found.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (product.artisanId !== artisan.id) {
      throw new ForbiddenException('You can only delete your own products.');
    }

    return this.prisma.product.delete({ where: { id: productId } });
  }
}
