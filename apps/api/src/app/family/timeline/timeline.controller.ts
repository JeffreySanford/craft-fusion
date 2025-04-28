import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Logger } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { TimelineEvent } from './schemas/timeline-event.schema';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { TimelineGateway } from './timeline.gateway';

@Controller('family/timeline')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimelineController {
  private readonly logger = new Logger(TimelineController.name);

  constructor(
    private readonly timelineService: TimelineService,
    private readonly timelineGateway: TimelineGateway
  ) {}

  @Get()
  @Roles('family')
  async findAll(): Promise<TimelineEvent[]> {
    this.logger.log('GET /family/timeline - Getting all timeline events');
    return this.timelineService.findAll();
  }

  @Get(':id')
  @Roles('family')
  async findOne(@Param('id') id: string): Promise<TimelineEvent> {
    this.logger.log(`GET /family/timeline/${id} - Getting timeline event`);
    return this.timelineService.findById(id);
  }

  @Post()
  @Roles('family', 'admin')
  async create(@Body() createEventDto: CreateTimelineEventDto): Promise<TimelineEvent> {
    this.logger.log(`POST /family/timeline - Creating new timeline event`);
    const newEvent = await this.timelineService.create(createEventDto);
    
    // Notify connected clients about the new event
    this.timelineGateway.notifyNewEvent(newEvent);
    
    return newEvent;
  }

  @Put(':id')
  @Roles('family', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: Partial<CreateTimelineEventDto>
  ): Promise<TimelineEvent> {
    this.logger.log(`PUT /family/timeline/${id} - Updating timeline event`);
    const updatedEvent = await this.timelineService.update(id, updateEventDto);
    
    // Notify connected clients about the updated event
    this.timelineGateway.notifyUpdatedEvent(updatedEvent);
    
    return updatedEvent;
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<TimelineEvent> {
    this.logger.log(`DELETE /family/timeline/${id} - Removing timeline event`);
    const removedEvent = await this.timelineService.remove(id);
    
    // Notify connected clients about the removed event
    this.timelineGateway.notifyRemovedEvent(id);
    
    return removedEvent;
  }
}
