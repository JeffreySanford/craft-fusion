import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimelineEvent } from './schemas/timeline-event.schema';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(
    @InjectModel(TimelineEvent.name) private timelineEventModel: Model<TimelineEvent>
  ) {}

  async findAll(): Promise<TimelineEvent[]> {
    this.logger.log('Finding all timeline events');
    return this.timelineEventModel.find().sort({ date: -1 }).exec();
  }

  async findById(id: string): Promise<TimelineEvent> {
    this.logger.log(`Finding timeline event by ID: ${id}`);
    return this.timelineEventModel.findById(id).exec();
  }

  async create(createEventDto: CreateTimelineEventDto): Promise<TimelineEvent> {
    this.logger.log(`Creating new timeline event: ${createEventDto.title}`);
    const newEvent = new this.timelineEventModel(createEventDto);
    return newEvent.save();
  }

  async update(id: string, updateEventDto: Partial<CreateTimelineEventDto>): Promise<TimelineEvent> {
    this.logger.log(`Updating timeline event: ${id}`);
    return this.timelineEventModel.findByIdAndUpdate(
      id, 
      { ...updateEventDto, updatedAt: new Date() }, 
      { new: true }
    ).exec();
  }

  async remove(id: string): Promise<TimelineEvent> {
    this.logger.log(`Removing timeline event: ${id}`);
    return this.timelineEventModel.findByIdAndDelete(id).exec();
  }
}
