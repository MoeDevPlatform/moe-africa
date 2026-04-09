// FILE: src/products/products.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('artisans/me/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateProductDto) {
    // The frontend sends priceRange: { min, max } — transform if needed
    const body = req.body;
    const finalDto: CreateProductDto = {
      ...dto,
      priceMin: dto.priceMin ?? body.priceRange?.min,
      priceMax: dto.priceMax ?? body.priceRange?.max,
    };
    return this.productsService.createProduct(req.user.id, finalDto);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ACCEPTED_MIME.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { url: `/uploads/products/${file.filename}` };
  }
}
