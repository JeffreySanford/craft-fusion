import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from '../logging/logging.service';
import { summarizeForLog } from '../logging/logging.utils';

export interface FirmsAlert {
  id: string;
  latitude: number;
  longitude: number;
  acqDate?: string;
  acqTime?: string;
  confidence?: number;
  frp?: number;
  brightness?: number;
  source?: string;
}

@Injectable()
export class FirmsService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultSource: string;

  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService, private readonly logger: LoggingService) {
    this.baseUrl = this.configService.get<string>('NASA_FIRMS_BASE_URL') || 'https://firms.modaps.eosdis.nasa.gov/api/area';
    this.apiKey = this.configService.get<string>('NASA_FIRMS_API_KEY') || '';
    this.defaultSource = this.configService.get<string>('NASA_FIRMS_SOURCE') || 'VIIRS_SNPP_NRT';
  }

  async getActiveFires(params: { lat: number; lng: number; radiusKm: number; days: number; source?: string; limit?: number }): Promise<FirmsAlert[]> {
    if (!this.apiKey) {
      this.logger.warn('NASA FIRMS API key not configured', { service: 'nasa-firms' });
      return [];
    }

    const payload = {
      lat: params.lat,
      lng: params.lng,
      radiusKm: params.radiusKm,
      days: params.days,
      source: params.source || this.defaultSource,
      limit: params.limit,
    };
    const startTime = Date.now();

    try {
      const bbox = this.calculateBoundingBox(params.lat, params.lng, params.radiusKm);
      const source = params.source || this.defaultSource;
      const url = `${this.baseUrl}/csv/${this.apiKey}/${source}/${bbox}/${params.days}`;

      const response = await firstValueFrom(this.httpService.get<string>(url, { responseType: 'text' }));

      const alerts = this.parseCsv(response.data || '', source);
      const limited = typeof params.limit === 'number' ? alerts.slice(0, params.limit) : alerts;

      this.logger.info('External API request success', {
        service: 'nasa-firms',
        operation: 'getActiveFires',
        payload,
        result: summarizeForLog(limited),
        durationMs: Date.now() - startTime,
        suppressConsole: true,
      });

      return limited;
    } catch (error) {
      this.logger.error('External API request error', {
        service: 'nasa-firms',
        operation: 'getActiveFires',
        payload,
        error,
        durationMs: Date.now() - startTime,
        suppressConsole: true,
      });
      return [];
    }
  }

  private calculateBoundingBox(lat: number, lng: number, radiusKm: number): string {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    const west = lng - lngDelta;
    const east = lng + lngDelta;
    const south = lat - latDelta;
    const north = lat + latDelta;

    return `${west},${south},${east},${north}`;
  }

  private parseCsv(csv: string, source?: string): FirmsAlert[] {
    const trimmed = csv.trim();
    if (!trimmed) return [];

    const lines = trimmed.split(/\r?\n/);
    const headerLine = lines.shift();
    if (!headerLine) return [];

    const headers = this.parseCsvLine(headerLine).map(header => header.trim());

    return lines
      .map(line => this.parseCsvLine(line))
      .filter(values => values.length === headers.length)
      .map((values, index) => {
        const record: Record<string, string> = {};
        headers.forEach((header, i) => {
          record[header] = values[i] ?? '';
        });

        const latitude = this.toNumber(record['latitude']);
        const longitude = this.toNumber(record['longitude']);
        const acqDate = record['acq_date'] || record['acqDate'] || '';
        const acqTime = record['acq_time'] || record['acqTime'] || '';
        const confidence = this.toNumber(record['confidence']);
        const frp = this.toNumber(record['frp']);
        const brightness = this.toNumber(record['brightness']) || this.toNumber(record['bright_ti4']);

        const alert: FirmsAlert = {
          id: `${latitude}-${longitude}-${acqDate}-${acqTime}-${index}`,
          latitude,
          longitude,
          acqDate,
          acqTime,
        };

        if (Number.isFinite(confidence)) {
          alert.confidence = confidence;
        }
        if (Number.isFinite(frp)) {
          alert.frp = frp;
        }
        if (Number.isFinite(brightness)) {
          alert.brightness = brightness;
        }
        if (source) {
          alert.source = source;
        }

        return alert;
      })
      .filter(alert => Number.isFinite(alert.latitude) && Number.isFinite(alert.longitude));
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i] as string;

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  private toNumber(value?: string): number {
    if (!value) return NaN;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
}
