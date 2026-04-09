// FILE: src/artisans/artisans.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArtisansService } from './artisans.service';
import { UpdateArtisanProfileDto } from './dto/update-artisan-profile.dto';

@Controller('artisans/me')
@UseGuards(JwtAuthGuard)
export class ArtisansController {
  constructor(private readonly artisansService: ArtisansService) {}

  @Get()
  async getProfile(@Req() req) {
    return this.artisansService.getProfile(req.user.id);
  }

  @Patch()
  async updateProfile(
    @Req() req,
    @Body() dto: UpdateArtisanProfileDto,
  ) {
    return this.artisansService.updateProfile(req.user.id, dto);
  }
}
