import { Test, TestingModule } from '@nestjs/testing';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

describe('SecurityController', () => {
  let controller: SecurityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityController],
      providers: [SecurityService],
    }).compile();

    controller = module.get<SecurityController>(SecurityController);
  });

  it('returns findings', () => {
    const findings = controller.getFindings();
    expect(Array.isArray(findings)).toBe(true);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]).toHaveProperty('id');
    expect(findings[0]).toHaveProperty('severity');
  });

  it('returns evidence', () => {
    const evidence = controller.getEvidence();
    expect(Array.isArray(evidence)).toBe(true);
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0]).toHaveProperty('id');
    expect(evidence[0]).toHaveProperty('type');
  });
});
