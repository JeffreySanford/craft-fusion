import { Injectable } from '@nestjs/common';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { UpdateTimelineEventDto } from './dto/update-timeline-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimelineEvent } from './schemas/timeline-event.schema';
import { LoggingService } from '../../logging/logging.service';
import { Observable, from } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TimelineService {
  constructor(@InjectModel(TimelineEvent.name) private timelineEventModel: Model<TimelineEvent>, private logger: LoggingService) {}

  create(createTimelineEventDto: CreateTimelineEventDto): Observable<TimelineEvent> {
    const createdEvent = new this.timelineEventModel(createTimelineEventDto);
    return from(createdEvent.save()).pipe(tap(result => this.logger.debug('Timeline event created', { id: (result as any).id || (result as any)._id })));
  }

  findAll(person?: string, type?: string): Observable<TimelineEvent[]> {
    this.logger.debug('Finding all timeline events');

    const filter: Record<string, unknown> = {};

    const mappedTypes = this.mapType(type);
    if (mappedTypes && mappedTypes.length) {
      filter['type'] = { $in: mappedTypes };
    }

    if (person && person.toLowerCase() !== 'all') {
      const normalizedPerson = this.normalizePerson(person);
      const regex = this.buildPersonRegex(person);
      const orClauses: Record<string, unknown>[] = [
        { person: { $regex: new RegExp(`^${normalizedPerson}$`, 'i') } },
      ];

      if (regex) {
        orClauses.push({ title: { $regex: regex } }, { description: { $regex: regex } });
      }

      filter['$or'] = orClauses;
    }

    return from(this.timelineEventModel.find(filter).exec()).pipe(tap(events => this.logger.debug(`Found ${events.length} timeline events`)));
  }

  private mapType(type?: string): string[] | undefined {
    if (!type) return undefined;
    const normalized = type.toLowerCase();
    if (normalized === 'professional') return ['professional', 'project'];
    if (normalized === 'education') return ['education'];
    if (normalized === 'technical') return ['project', 'personal'];
    if (normalized === 'personal') return ['personal', 'historical'];
    if (normalized === 'historical') return ['historical'];
    if (normalized === 'all') return undefined;
    return [type];
  }

  private normalizePerson(person: string): string {
    const normalized = person.toLowerCase();
    if (normalized === 'jeffrey' || normalized === 'jeffrey-sanford') {
      return 'jeffrey-sanford';
    }
    if (normalized === 'raymond' || normalized === 'raymond-sanford') {
      return 'raymond-sanford';
    }
    return normalized;
  }

  private buildPersonRegex(person: string): RegExp | null {
    const normalized = person.toLowerCase();
    if (normalized === 'raymond-sanford' || normalized === 'raymond') {
      return /(ray(\s|$)|raymond|sanford)/i;
    }
    if (normalized === 'jeffrey-sanford' || normalized === 'jeffrey') {
      return /(jeffrey|developer journal)/i;
    }
    return new RegExp(normalized, 'i');
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
      }),
    );
  }

  update(id: string, updateTimelineEventDto: UpdateTimelineEventDto): Observable<TimelineEvent | null> {
    this.logger.debug(`Updating timeline event ${id}: ${JSON.stringify(updateTimelineEventDto)}`);

    return from(this.timelineEventModel.findByIdAndUpdate(id, updateTimelineEventDto, { new: true }).exec()).pipe(
      tap(updatedEvent => {
        if (!updatedEvent) {
          this.logger.warn(`Timeline event with ID ${id} not found during update`);
        } else {
          this.logger.debug(`Timeline event updated: ${updatedEvent.title}`);
        }
      }),
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
      }),
    );
  }
}
