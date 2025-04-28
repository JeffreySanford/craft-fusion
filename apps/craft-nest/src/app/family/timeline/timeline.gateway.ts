import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TimelineEvent } from './entities/timeline-event.entity';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'timeline',
})
export class TimelineGateway {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TimelineGateway.name);

  notifyNewEvent(event: TimelineEvent) {
    this.logger.log(`Broadcasting new timeline event: ${event.title} (ID: ${event.id})`);
    this.server.emit('newEvent', event);
  }

  notifyUpdatedEvent(event: TimelineEvent) {
    this.logger.log(`Broadcasting updated timeline event: ${event.title} (ID: ${event.id})`);
    this.server.emit('updatedEvent', event);
  }

  notifyDeletedEvent(eventId: string) {
    this.logger.log(`Broadcasting deleted timeline event ID: ${eventId}`);
    this.server.emit('deletedEvent', eventId);
  }

  handleConnection(client: any) {
    this.logger.log(`Client connected to timeline gateway: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected from timeline gateway: ${client.id}`);
  }
}
