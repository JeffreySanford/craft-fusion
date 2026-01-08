import { Test, TestingModule } from '@nestjs/testing';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { TimelineGateway } from './timeline.gateway';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { UpdateTimelineEventDto } from './dto/update-timeline-event.dto';
import { TimelineEventType } from './schemas/timeline-event.schema';
import { of, throwError } from 'rxjs';
import { NotFoundException } from '@nestjs/common';

describe('TimelineController', () => {
  let controller: TimelineController;
  let service: TimelineService;
  let gateway: TimelineGateway;

  const mockTimelineEvent = {
    id: '507f1f77bcf86cd799439011',
    title: 'Test Event',
    description: 'Test Description',
    date: new Date('2023-01-01'),
    type: TimelineEventType.PERSONAL,
    imageUrl: 'http://example.com/image.jpg',
    actionLink: 'http://example.com',
    createdBy: {
      id: 'system',
      username: 'system',
      role: 'system',
    },
    person: 'jeffrey-sanford',
  };

  const mockTimelineService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTimelineGateway = {
    notifyNewEvent: jest.fn(),
    notifyUpdatedEvent: jest.fn(),
    notifyDeletedEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimelineController],
      providers: [
        { provide: TimelineService, useValue: mockTimelineService },
        { provide: TimelineGateway, useValue: mockTimelineGateway },
      ],
    }).compile();

    controller = module.get<TimelineController>(TimelineController);
    service = module.get<TimelineService>(TimelineService);
    gateway = module.get<TimelineGateway>(TimelineGateway);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new timeline event and notify gateway', (done) => {
      const createDto: CreateTimelineEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2023-01-01T00:00:00.000Z',
        type: TimelineEventType.PERSONAL,
        person: 'jeffrey-sanford',
      };

      mockTimelineService.create.mockReturnValue(of(mockTimelineEvent));
      mockTimelineGateway.notifyNewEvent.mockReturnValue(void 0);

      controller.create(createDto).subscribe((result) => {
        expect(service.create).toHaveBeenCalledWith(createDto);
        expect(gateway.notifyNewEvent).toHaveBeenCalledWith(mockTimelineEvent);
        expect(result).toEqual(mockTimelineEvent);
        done();
      });
    });

    it('should handle creation errors', (done) => {
      const createDto: CreateTimelineEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2023-01-01T00:00:00.000Z',
        type: TimelineEventType.PERSONAL,
        person: 'jeffrey-sanford',
      };

      mockTimelineService.create.mockReturnValue(throwError(() => new Error('Creation failed')));

      controller.create(createDto).subscribe({
        error: (error) => {
          expect(error.message).toBe('Creation failed');
          done();
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all timeline events', (done) => {
      const events = [mockTimelineEvent];
      mockTimelineService.findAll.mockReturnValue(of(events));

      controller.findAll().subscribe((result) => {
        expect(service.findAll).toHaveBeenCalled();
        expect(result).toEqual(events);
        done();
      });
    });

    it('should handle findAll errors', (done) => {
      mockTimelineService.findAll.mockReturnValue(throwError(() => new Error('Find failed')));

      controller.findAll().subscribe({
        error: (error) => {
          expect(error.message).toBe('Find failed');
          done();
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a timeline event by id', (done) => {
      mockTimelineService.findOne.mockReturnValue(of(mockTimelineEvent));

      controller.findOne('507f1f77bcf86cd799439011').subscribe((result) => {
        expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(result).toEqual(mockTimelineEvent);
        done();
      });
    });

    it('should throw NotFoundException if event not found', (done) => {
      mockTimelineService.findOne.mockReturnValue(of(null));

      controller.findOne('507f1f77bcf86cd799439011').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toBe('Timeline event with ID 507f1f77bcf86cd799439011 not found');
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should update a timeline event and notify gateway', (done) => {
      const updateDto: UpdateTimelineEventDto = {
        title: 'Updated Event',
      };
      const updatedEvent = { ...mockTimelineEvent, ...updateDto };

      mockTimelineService.update.mockReturnValue(of(updatedEvent));
      mockTimelineGateway.notifyUpdatedEvent.mockReturnValue(void 0);

      controller.update('507f1f77bcf86cd799439011', updateDto).subscribe((result) => {
        expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        expect(gateway.notifyUpdatedEvent).toHaveBeenCalledWith(updatedEvent);
        expect(result).toEqual(updatedEvent);
        done();
      });
    });

    it('should throw NotFoundException if event not found for update', (done) => {
      const updateDto: UpdateTimelineEventDto = {
        title: 'Updated Event',
      };

      mockTimelineService.update.mockReturnValue(of(null));

      controller.update('507f1f77bcf86cd799439011', updateDto).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toBe('Timeline event with ID 507f1f77bcf86cd799439011 not found');
          done();
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a timeline event and notify gateway', (done) => {
      mockTimelineService.remove.mockReturnValue(of(mockTimelineEvent));
      mockTimelineGateway.notifyDeletedEvent.mockReturnValue(void 0);

      controller.remove('507f1f77bcf86cd799439011').subscribe((result) => {
        expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(gateway.notifyDeletedEvent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(result).toEqual(mockTimelineEvent);
        done();
      });
    });

    it('should throw NotFoundException if event not found for deletion', (done) => {
      mockTimelineService.remove.mockReturnValue(of(null));

      controller.remove('507f1f77bcf86cd799439011').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toBe('Timeline event with ID 507f1f77bcf86cd799439011 not found');
          done();
        },
      });
    });
  });
});
