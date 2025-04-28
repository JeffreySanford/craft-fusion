import { Injectable } from '@nestjs/common';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { UpdateTimelineEventDto } from './dto/update-timeline-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimelineEvent } from './schemas/timeline-event.schema';
import { LoggingService } from '../../logging/logging.service';
import { Observable, from, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

@Injectable()
export class TimelineService {
  constructor(
    @InjectModel(TimelineEvent.name) private timelineEventModel: Model<TimelineEvent>,
    private logger: LoggingService
  ) {}

  create(createTimelineEventDto: CreateTimelineEventDto): Observable<TimelineEvent> {
    this.logger.debug('Creating timeline event', createTimelineEventDto);
    
    const createdEvent = new this.timelineEventModel(createTimelineEventDto);
    return from(createdEvent.save()).pipe(
      tap(result => this.logger.debug('Timeline event created', { id: result.id }))
    );
  }

  findAll(): Observable<TimelineEvent[]> {
    this.logger.debug('Finding all timeline events');
    
    return from(this.timelineEventModel.find().exec()).pipe(
      tap(events => this.logger.debug(`Found ${events.length} timeline events`))
    );
  }

  findOne(id: string): Observable<TimelineEvent | null> {
    this.logger.debug(`Finding timeline event with ID: ${id}`);
    
    return from(this.timelineEventModel.findById(id).exec()).pipe(
      tap(event => {
        if (!event) {
          this.logger.warn(`Timeline event with ID ${id} not found`);
        } else {
          this.logger.debug(`Found timeline event: ${event.title}`);
        }
      })
    );
  }

  update(id: string, updateTimelineEventDto: UpdateTimelineEventDto): Observable<TimelineEvent | null> {
    this.logger.debug(`Updating timeline event ${id}: ${JSON.stringify(updateTimelineEventDto)}`);
    
    return from(this.timelineEventModel
      .findByIdAndUpdate(id, updateTimelineEventDto, { new: true })
      .exec()
    ).pipe(
      tap(updatedEvent => {
        if (!updatedEvent) {
          this.logger.warn(`Timeline event with ID ${id} not found during update`);
        } else {
          this.logger.debug(`Timeline event updated: ${updatedEvent.title}`);
        }
      })
    );
  }

  remove(id: string): Observable<TimelineEvent | null> {
    this.logger.debug(`Removing timeline event with ID: ${id}`);
    
    return from(this.timelineEventModel.findByIdAndDelete(id).exec()).pipe(
      tap(removedEvent => {
        if (!removedEvent) {
          this.logger.warn(`Timeline event with ID ${id} not found during deletion`);
        } else {
          this.logger.debug(`Timeline event removed: ${removedEvent.title}`);
        }
      })
    );
  }
}
