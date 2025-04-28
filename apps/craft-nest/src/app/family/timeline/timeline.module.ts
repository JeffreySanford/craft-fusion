import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { TimelineGateway } from './timeline.gateway';
import { TimelineEvent, TimelineEventSchema } from './schemas/timeline-event.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimelineEvent.name, schema: TimelineEventSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'default_secret_for_dev',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [TimelineController],
  providers: [TimelineService, TimelineGateway],
  exports: [TimelineService],
})
export class TimelineModule {}
