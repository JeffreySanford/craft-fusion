import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService, SecurityFinding, SecurityEvidence } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityService],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFindings', () => {
    it('should return an array of security findings', () => {
      const findings = service.getFindings();
      expect(Array.isArray(findings)).toBe(true);
      expect(findings.length).toBeGreaterThan(0);
    });

    it('should return findings with required properties', () => {
      const findings = service.getFindings();
      findings.forEach((finding: SecurityFinding) => {
        expect(finding).toHaveProperty('id');
        expect(finding).toHaveProperty('source');
        expect(finding).toHaveProperty('severity');
        expect(finding).toHaveProperty('title');
        expect(finding).toHaveProperty('status');
        expect(finding).toHaveProperty('createdAt');
      });
    });

    it('should return findings with valid severity levels', () => {
      const findings = service.getFindings();
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      findings.forEach((finding: SecurityFinding) => {
        expect(validSeverities).toContain(finding.severity);
      });
    });

    it('should return findings with valid status values', () => {
      const findings = service.getFindings();
      const validStatuses = ['open', 'closed'];
      findings.forEach((finding: SecurityFinding) => {
        expect(validStatuses).toContain(finding.status);
      });
    });

    it('should include both open and closed findings', () => {
      const findings = service.getFindings();
      const hasOpen = findings.some(f => f.status === 'open');
      const hasClosed = findings.some(f => f.status === 'closed');
      expect(hasOpen).toBe(true);
      expect(hasClosed).toBe(true);
    });

    it('should include findings from multiple sources', () => {
      const findings = service.getFindings();
      const sources = new Set(findings.map(f => f.source));
      expect(sources.size).toBeGreaterThan(1);
      expect(sources.has('oscal') || sources.has('sca') || sources.has('realtime')).toBe(true);
    });

    it('should include critical severity findings', () => {
      const findings = service.getFindings();
      const criticalFindings = findings.filter(f => f.severity === 'critical');
      expect(criticalFindings.length).toBeGreaterThan(0);
    });

    it('should have valid ISO 8601 timestamps', () => {
      const findings = service.getFindings();
      findings.forEach((finding: SecurityFinding) => {
        const date = new Date(finding.createdAt);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });
  });

  describe('getEvidence', () => {
    it('should return an array of security evidence', () => {
      const evidence = service.getEvidence();
      expect(Array.isArray(evidence)).toBe(true);
      expect(evidence.length).toBeGreaterThan(0);
    });

    it('should return evidence with required properties', () => {
      const evidence = service.getEvidence();
      evidence.forEach((item: SecurityEvidence) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('createdAt');
      });
    });

    it('should return evidence with valid types', () => {
      const evidence = service.getEvidence();
      const validTypes = ['oscal', 'sca', 'sbom', 'realtime'];
      evidence.forEach((item: SecurityEvidence) => {
        expect(validTypes).toContain(item.type);
      });
    });

    it('should return evidence with valid status values', () => {
      const evidence = service.getEvidence();
      const validStatuses = ['ready', 'pending', 'failed'];
      evidence.forEach((item: SecurityEvidence) => {
        expect(validStatuses).toContain(item.status);
      });
    });

    it('should include evidence from multiple types', () => {
      const evidence = service.getEvidence();
      const types = new Set(evidence.map(e => e.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('should include ready evidence with hashes', () => {
      const evidence = service.getEvidence();
      const readyEvidence = evidence.filter(e => e.status === 'ready');
      expect(readyEvidence.length).toBeGreaterThan(0);
      readyEvidence.forEach((item: SecurityEvidence) => {
        expect(item.hash).toBeDefined();
        expect(item.hash).not.toBe('');
      });
    });

    it('should include evidence with download URLs when ready', () => {
      const evidence = service.getEvidence();
      const readyEvidence = evidence.filter(e => e.status === 'ready');
      readyEvidence.forEach((item: SecurityEvidence) => {
        expect(item.downloadUrl).toBeDefined();
        expect(item.downloadUrl).not.toBe('');
      });
    });

    it('should have valid ISO 8601 timestamps', () => {
      const evidence = service.getEvidence();
      evidence.forEach((item: SecurityEvidence) => {
        const date = new Date(item.createdAt);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });

    it('should include retention information', () => {
      const evidence = service.getEvidence();
      const withRetention = evidence.filter(e => e.retention);
      expect(withRetention.length).toBeGreaterThan(0);
    });

    it('should include pending evidence', () => {
      const evidence = service.getEvidence();
      const pendingEvidence = evidence.filter(e => e.status === 'pending');
      expect(pendingEvidence.length).toBeGreaterThan(0);
    });
  });
});
