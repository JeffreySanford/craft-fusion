import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { lastValueFrom } from 'rxjs';
import { TimelineService } from './timeline.service';
import { TimelineEvent } from './schemas/timeline-event.schema';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { UpdateTimelineEventDto } from './dto/update-timeline-event.dto';
import { TimelineEventType } from './schemas/timeline-event.schema';
import { LoggingService } from '../../logging/logging.service';

describe('TimelineService', () => {
  let service: TimelineService;
  let mockTimelineEventModel: any;

  const mockTimelineEvent = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Event',
    description: 'Test Description',
    date: new Date('2023-01-01'),
    type: TimelineEventType.PERSONAL,
    imageUrl: 'http://example.com/image.jpg',
    actionLink: 'http://example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoggingService = {
    debug: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    mockTimelineEventModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(mockTimelineEvent),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        {
          provide: getModelToken(TimelineEvent.name),
          useValue: mockTimelineEventModel,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    service = module.get<TimelineService>(TimelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new timeline event', async () => {
      const createDto: CreateTimelineEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2023-01-01T00:00:00.000Z',
        type: TimelineEventType.PERSONAL,
        imageUrl: 'http://example.com/image.jpg',
        actionLink: 'http://example.com',
      };

      const result = await lastValueFrom(service.create(createDto));

      expect(mockTimelineEventModel).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockTimelineEvent);
    });

    it('should handle creation errors', async () => {
      const createDto: CreateTimelineEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2023-01-01T00:00:00.000Z',
        type: TimelineEventType.PERSONAL,
      };

      const mockInstance = {
        save: jest.fn().mockRejectedValue(new Error('Creation failed')),
      };

      mockTimelineEventModel.mockImplementation(() => mockInstance);

      await expect(lastValueFrom(service.create(createDto))).rejects.toThrow('Creation failed');
    });
  });

  describe('findAll', () => {
    it('should return all timeline events', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([mockTimelineEvent]),
      };

      mockTimelineEventModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await lastValueFrom(service.findAll());

      expect(mockTimelineEventModel.find).toHaveBeenCalledWith();
      expect(result).toEqual([mockTimelineEvent]);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockTimelineEventModel.find = jest.fn().mockReturnValue(mockQuery);

      await expect(lastValueFrom(service.findAll())).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a timeline event by id', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockTimelineEvent),
      };

      mockTimelineEventModel.findById = jest.fn().mockReturnValue(mockQuery);

      const result = await lastValueFrom(service.findOne('507f1f77bcf86cd799439011'));

      expect(mockTimelineEventModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockTimelineEvent);
    });

    it('should return null if event not found', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      mockTimelineEventModel.findById = jest.fn().mockReturnValue(mockQuery);

      const result = await lastValueFrom(service.findOne('507f1f77bcf86cd799439011'));

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a timeline event', async () => {
      const updateDto: UpdateTimelineEventDto = {
        title: 'Updated Event',
        description: 'Updated Description',
      };

      const updatedEvent = { ...mockTimelineEvent, ...updateDto };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(updatedEvent),
      };

      mockTimelineEventModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

      const result = await lastValueFrom(service.update('507f1f77bcf86cd799439011', updateDto));

      expect(mockTimelineEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
        { new: true }
      );
      expect(result).toEqual(updatedEvent);
    });

    it('should return null if event not found for update', async () => {
      const updateDto: UpdateTimelineEventDto = {
        title: 'Updated Event',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      mockTimelineEventModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

      const result = await lastValueFrom(service.update('507f1f77bcf86cd799439011', updateDto));

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete a timeline event', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockTimelineEvent),
      };

      mockTimelineEventModel.findByIdAndDelete = jest.fn().mockReturnValue(mockQuery);

      const result = await lastValueFrom(service.remove('507f1f77bcf86cd799439011'));

      expect(mockTimelineEventModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockTimelineEvent);
    });

    it('should return null if event not found for deletion', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      mockTimelineEventModel.findByIdAndDelete = jest.fn().mockReturnValue(mockQuery);

      const result = await lastValueFrom(service.remove('507f1f77bcf86cd799439011'));

      expect(result).toBeNull();
    });
  });
});