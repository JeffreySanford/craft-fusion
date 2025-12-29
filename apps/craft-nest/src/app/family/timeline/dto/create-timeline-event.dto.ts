import { IsNotEmpty, IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { TimelineEventType } from '../schemas/timeline-event.schema';

export class CreateTimelineEventDto {
  @IsNotEmpty()
  @IsString()
  title: string = '';

  @IsNotEmpty()
  @IsString()
  description: string = '';

  @IsNotEmpty()
  @IsDateString()
  date: string = '';

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  actionLink?: string;

  @IsNotEmpty()
  @IsEnum(TimelineEventType)
  type: TimelineEventType = TimelineEventType.PERSONAL;
}
