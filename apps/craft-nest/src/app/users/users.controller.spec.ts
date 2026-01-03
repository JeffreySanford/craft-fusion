import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { of } from 'rxjs';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    getAllUsers: jest.fn().mockReturnValue(of([])),
    getUserById: jest.fn().mockReturnValue(of(null)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
