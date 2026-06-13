import { Controller, Get, Query } from '@nestjs/common';
import { FirmsService } from './firms.service';

@Controller('firms')
export class FirmsController {
  constructor(private readonly firmsService: FirmsService) {}

  @Get('active')
  async getActiveFires(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm: number,
    @Query('days') days: number,
    @Query('limit') limit?: number,
    @Query('source') source?: string,
  ) {
    const params: any = { lat, lng, radiusKm, days };
    if (typeof limit === 'number') params.limit = limit;
    if (typeof source === 'string') params.source = source;
    return this.firmsService.getActiveFires(params);
  }
}
