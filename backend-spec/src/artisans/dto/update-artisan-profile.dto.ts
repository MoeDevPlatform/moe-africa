// FILE: src/artisans/dto/update-artisan-profile.dto.ts
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateArtisanProfileDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
