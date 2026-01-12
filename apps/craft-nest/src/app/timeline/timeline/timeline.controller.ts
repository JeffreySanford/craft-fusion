import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Logger, Query } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { UpdateTimelineEventDto } from './dto/update-timeline-event.dto';
import { TimelineGateway } from './timeline.gateway';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TimelineEvent as TimelineEventEntity } from './entities/timeline-event.entity';
import { TimelineEvent as TimelineEventSchema } from './schemas/timeline-event.schema';

@Controller('timeline')
export class TimelineController {
  private readonly logger = new Logger(TimelineController.name);

  constructor(private readonly timelineService: TimelineService, private readonly timelineGateway: TimelineGateway) {}

  // Helper method to convert schema to entity
  private mapToEntity(event: TimelineEventSchema): TimelineEventEntity {
    const eventAny = event as any;
    return {
      ...eventAny,
      // If createdBy already contains User data, use it; otherwise create a default User object
      createdBy: eventAny.createdBy?.id
        ? eventAny.createdBy
        : {
            id: 'system',
            username: 'system',
            role: 'system',
            // Include other required User properties with defaults
          },
    };
  }

  @Post()
  create(@Body() createTimelineEventDto: CreateTimelineEventDto): Observable<any> {
    this.logger.log(`Creating new timeline event: ${createTimelineEventDto.title}`);

    return this.timelineService.create(createTimelineEventDto).pipe(
      tap(event => this.logger.log(`Timeline event created with ID: ${(event as any).id || (event as any)._id}`)),
      map(event => {
        const entityEvent = this.mapToEntity(event);
        this.timelineGateway.notifyNewEvent(entityEvent);
        return event;
      }),
    );
  }

  @Get()
  findAll(@Query('person') person?: string, @Query('type') type?: string): Observable<any[]> {
    this.logger.log('Retrieving all timeline events');
    return this.timelineService.findAll(person, type).pipe(tap(events => this.logger.debug(`Found ${events.length} timeline events`)));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<any> {
    this.logger.log(`Retrieving timeline event with ID: ${id}`);

    return this.timelineService.findOne(id).pipe(
      map(event => {
        if (!event) {
          this.logger.warn(`Timeline event with ID ${id} not found`);
          throw new NotFoundException(`Timeline event with ID ${id} not found`);
        }
        this.logger.debug(`Retrieved timeline event: ${event.title}`);
        return event;
      }),
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimelineEventDto: UpdateTimelineEventDto): Observable<any> {
    this.logger.log(`Updating timeline event with ID: ${id}`);

    return this.timelineService.update(id, updateTimelineEventDto).pipe(
      map(updatedEvent => {
        if (!updatedEvent) {
          this.logger.warn(`Timeline event with ID ${id} not found for update`);
          throw new NotFoundException(`Timeline event with ID ${id} not found`);
        }

        this.logger.debug(`Timeline event updated: ${updatedEvent.title}`);
        const entityEvent = this.mapToEntity(updatedEvent);
        this.timelineGateway.notifyUpdatedEvent(entityEvent);
        return updatedEvent;
      }),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Observable<any> {
    this.logger.log(`Deleting timeline event with ID: ${id}`);

    return this.timelineService.remove(id).pipe(
      map(removedEvent => {
        if (!removedEvent) {
          this.logger.warn(`Timeline event with ID ${id} not found for deletion`);
          throw new NotFoundException(`Timeline event with ID ${id} not found`);
        }

        this.logger.log(`Timeline event deleted: ${removedEvent.title}`);
        this.timelineGateway.notifyDeletedEvent(id);
        return removedEvent;
      }),
    );
  }
}
