import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimelineController } from './timeline.controller';
import { TimelineGateway } from './timeline.gateway';
import { TimelineService } from './timeline.service';
import { TimelineEvent, TimelineEventSchema } from './schemas/timeline-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimelineEvent.name, schema: TimelineEventSchema }
    ])
  ],
  controllers: [TimelineController],
  providers: [TimelineService, TimelineGateway],
  exports: [TimelineService]
})
export class TimelineModule {}
