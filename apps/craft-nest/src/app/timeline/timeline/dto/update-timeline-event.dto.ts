import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { TimelineEventType } from '../schemas/timeline-event.schema';

export class UpdateTimelineEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  actionLink?: string;

  @IsOptional()
  @IsEnum(TimelineEventType)
  type?: TimelineEventType;
}
