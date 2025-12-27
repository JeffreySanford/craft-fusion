import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: Partial<AdminService>;

  beforeEach(async () => {
    adminService = {
      getMetrics: async () => ({ activeUsers: 1, permissionRequests: 0, connection: 'Secure' })
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminService }]
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should return metrics', async () => {
    const metrics = await controller.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.activeUsers).toBeDefined();
    expect(metrics.permissionRequests).toBeDefined();
    expect(metrics.connection).toBeDefined();
  });
});