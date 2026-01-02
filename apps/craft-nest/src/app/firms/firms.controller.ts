import { Controller, Get, Query } from '@nestjs/common';
import { FirmsService } from './firms.service';

@Controller('firms')
export class FirmsController {
  constructor(private readonly firmsService: FirmsService) {}

  @Get('active')
  async getActiveFires(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('days') days?: string,
    @Query('source') source?: string,
    @Query('limit') limit?: string,
  ) {
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return [];
    }

    const params: {
      lat: number;
      lng: number;
      radiusKm: number;
      days: number;
      source?: string;
      limit?: number;
    } = {
      lat: latitude,
      lng: longitude,
      radiusKm: Number(radiusKm || 120),
      days: Number(days || 2),
    };

    if (source) {
      params.source = source;
    }

    const limitValue = limit !== undefined ? Number(limit) : undefined;
    if (typeof limitValue === 'number' && Number.isFinite(limitValue)) {
      params.limit = limitValue;
    }

    return this.firmsService.getActiveFires(params);
  }
}
