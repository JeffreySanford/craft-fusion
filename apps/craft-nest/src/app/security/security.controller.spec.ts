import { Test, TestingModule } from '@nestjs/testing';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { PdfGenerationService } from '../common/pdf-generation.service';
import { of } from 'rxjs';
import { SecurityScanGateway } from '../security-scan/security-scan.gateway';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

describe('SecurityController', () => {
  let controller: SecurityController;
  let securityService: SecurityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityController],
      providers: [
        SecurityService,
        {
          provide: PdfGenerationService,
          useValue: {
            generateSecurityReport: jest.fn().mockReturnValue(of(Buffer.from(''))),
          },
        },
        {
          provide: SecurityScanGateway,
          useValue: {
            createScan: jest.fn(),
            emitProgress: jest.fn(),
            completeScan: jest.fn(),
            failScan: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SecurityController>(SecurityController);
    securityService = module.get<SecurityService>(SecurityService);
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

  it('exports OSCAL XML with a controlResults wrapper', () => {
    const profile = securityService.getOscalProfiles().find(item => item.id === 'oscal-002');
    if (profile) {
      profile.controlResults = [
        {
          id: 'CTRL-4',
          title: 'Security Logging and Monitoring',
          status: 'notchecked',
        },
      ];
    }

    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    controller.downloadOscalReport('oscal-002', 'xml', res as any);

    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain('<controlResults>');
    expect(xml).not.toContain('<controlResultss>');
  });
});
