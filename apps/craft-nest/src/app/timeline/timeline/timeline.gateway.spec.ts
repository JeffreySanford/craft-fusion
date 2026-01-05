import { Test, TestingModule } from '@nestjs/testing';
import { TimelineGateway } from './timeline.gateway';
import { TimelineEvent } from './entities/timeline-event.entity';
import { Logger } from '@nestjs/common';

describe('TimelineGateway', () => {
  let gateway: TimelineGateway;
  let mockServer: any;
  let loggerSpy: jest.SpyInstance;

  const mockTimelineEvent: TimelineEvent = {
    id: '507f1f77bcf86cd799439011',
    title: 'Test Event',
    description: 'Test Description',
    date: new Date('2023-01-01'),
    imageUrl: 'http://example.com/image.jpg',
    actionLink: 'http://example.com',
    createdBy: { id: 'system', username: 'system', email: 'system@example.com', firstName: 'System', lastName: 'User', createdAt: new Date(), updatedAt: new Date() },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TimelineGateway],
    }).compile();

    gateway = module.get<TimelineGateway>(TimelineGateway);
    // Manually set the server since it's injected via decorator
    (gateway as any).server = mockServer;

    // Spy on logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('notifyNewEvent', () => {
    it('should emit newEvent and log the action', () => {
      gateway.notifyNewEvent(mockTimelineEvent);

      expect(mockServer.emit).toHaveBeenCalledWith('newEvent', mockTimelineEvent);
      expect(loggerSpy).toHaveBeenCalledWith(
        `Broadcasting new timeline event: ${mockTimelineEvent.title} (ID: ${mockTimelineEvent.id})`
      );
    });
  });

  describe('notifyUpdatedEvent', () => {
    it('should emit updatedEvent and log the action', () => {
      gateway.notifyUpdatedEvent(mockTimelineEvent);

      expect(mockServer.emit).toHaveBeenCalledWith('updatedEvent', mockTimelineEvent);
      expect(loggerSpy).toHaveBeenCalledWith(
        `Broadcasting updated timeline event: ${mockTimelineEvent.title} (ID: ${mockTimelineEvent.id})`
      );
    });
  });

  describe('notifyDeletedEvent', () => {
    it('should emit deletedEvent and log the action', () => {
      const eventId = '507f1f77bcf86cd799439011';

      gateway.notifyDeletedEvent(eventId);

      expect(mockServer.emit).toHaveBeenCalledWith('deletedEvent', eventId);
      expect(loggerSpy).toHaveBeenCalledWith(
        `Broadcasting deleted timeline event ID: ${eventId}`
      );
    });
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const mockClient = { id: 'client123' };

      gateway.handleConnection(mockClient);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Client connected to timeline gateway: ${mockClient.id}`
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const mockClient = { id: 'client123' };

      gateway.handleDisconnect(mockClient);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Client disconnected from timeline gateway: ${mockClient.id}`
      );
    });
  });
});