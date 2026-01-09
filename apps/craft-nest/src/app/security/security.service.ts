import { Injectable } from '@nestjs/common';

export interface SecurityFinding {
  id: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  component?: string;
  status: 'open' | 'closed';
  createdAt: string;
  description?: string;
  remediation?: string;
  cveId?: string;
}

export interface SecurityEvidence {
  id: string;
  type: 'oscal' | 'sca' | 'sbom' | 'realtime';
  name: string;
  status: 'ready' | 'pending' | 'failed';
  createdAt: string;
  createdBy?: string;
  hash?: string;
  downloadUrl?: string;
  retention?: string;
  sizeBytes?: number;
}

export interface Sbom {
  id: string;
  name: string;
  format: 'CycloneDX' | 'SPDX';
  created: string;
  delta: string;
  status: 'ready' | 'pending' | 'failed';
  components?: number;
  vulnerabilities?: number;
  downloadUrl?: string;
}

export interface OscalProfile {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'pending';
  lastRun: string;
  pass: number;
  fail: number;
  duration: string;
  profileType?: string;
}

export interface ScaItem {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'todo';
  description?: string;
  lastChecked?: string;
}

export interface RealtimeCheck {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  duration: string;
  lastRun?: string;
  endpoint?: string;
}

@Injectable()
export class SecurityService {
  private findings: SecurityFinding[] = this.initializeFindings();
  private evidence: SecurityEvidence[] = this.initializeEvidence();
  private sboms: Sbom[] = this.initializeSboms();
  private oscalProfiles: OscalProfile[] = this.initializeOscalProfiles();
  private scaItems: ScaItem[] = this.initializeScaItems();
  private realtimeChecks: RealtimeCheck[] = this.initializeRealtimeChecks();

  getFindings(): SecurityFinding[] {
    return this.findings;
  }

  getEvidence(): SecurityEvidence[] {
    return this.evidence;
  }

  getSboms(): Sbom[] {
    return this.sboms;
  }

  getOscalProfiles(): OscalProfile[] {
    return this.oscalProfiles;
  }

  getScaItems(): ScaItem[] {
    return this.scaItems;
  }

  getRealtimeChecks(): RealtimeCheck[] {
    return this.realtimeChecks;
  }

  private initializeFindings(): SecurityFinding[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'finding-001',
        source: 'oscal',
        severity: 'critical',
        title: 'Missing CSRF protection for state-changing operations',
        component: 'authentication',
        status: 'open',
        createdAt: now.toISOString(),
        description: 'Cookie-based authentication implemented without CSRF tokens. State-changing endpoints vulnerable to cross-site request forgery.',
        remediation: 'Implement CSRF token validation for all POST/PUT/DELETE endpoints. Add double-submit cookie pattern or synchronizer token.',
      },
      {
        id: 'finding-002',
        source: 'sca',
        severity: 'high',
        title: 'Known vulnerability in transitive dependency',
        component: 'supply-chain',
        status: 'open',
        createdAt: yesterday.toISOString(),
        description: 'Detected outdated package with known CVE in dependency tree.',
        remediation: 'Update parent package to latest version or explicitly override vulnerable transitive dependency.',
        cveId: 'CVE-2024-XXXXX',
      },
      {
        id: 'finding-003',
        source: 'realtime',
        severity: 'medium',
        title: 'Rate limiting not enforced on authentication endpoints',
        component: 'auth-guard',
        status: 'open',
        createdAt: yesterday.toISOString(),
        description: 'Login and refresh endpoints lack rate limiting, exposing system to brute force attacks.',
        remediation: 'Implement rate limiting middleware with exponential backoff. Consider using @nestjs/throttler.',
      },
      {
        id: 'finding-004',
        source: 'oscal',
        severity: 'medium',
        title: 'Insufficient password complexity requirements',
        component: 'user-management',
        status: 'open',
        createdAt: twoDaysAgo.toISOString(),
        description: 'Current demo authentication accepts weak passwords. No minimum length or complexity validation.',
        remediation: 'Enforce minimum 12 characters with mix of uppercase, lowercase, numbers, and symbols.',
      },
      {
        id: 'finding-005',
        source: 'sca',
        severity: 'low',
        title: 'Development dependencies in production bundle',
        component: 'build-pipeline',
        status: 'open',
        createdAt: twoDaysAgo.toISOString(),
        description: 'Some devDependencies may be bundled in production build, increasing attack surface.',
        remediation: 'Audit webpack configuration and ensure tree-shaking removes unused development code.',
      },
      {
        id: 'finding-006',
        source: 'realtime',
        severity: 'low',
        title: 'HSTS header not configured',
        component: 'web-server',
        status: 'closed',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'HTTP Strict Transport Security header missing from responses.',
        remediation: 'Configured Nginx to add HSTS header with max-age=31536000.',
      },
      {
        id: 'finding-007',
        source: 'oscal',
        severity: 'high',
        title: 'Server-side token revocation not implemented',
        component: 'refresh-tokens',
        status: 'open',
        createdAt: now.toISOString(),
        description: 'Refresh tokens stored in MongoDB but no active revocation mechanism. Compromised tokens remain valid until expiry.',
        remediation: 'Implement token blacklist checking in AuthGuard. Add admin endpoint to revoke tokens on-demand.',
      },
    ];
  }

  private initializeEvidence(): SecurityEvidence[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'evidence-001',
        type: 'sbom',
        name: 'Frontend SBOM (CycloneDX 1.5)',
        status: 'ready',
        createdAt: now.toISOString(),
        createdBy: 'ci-pipeline',
        hash: 'sha256:a3f5e9d1c2b8f4e6d7a9b2c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
        downloadUrl: '/api/security/artifacts/sbom-frontend-20260108.json',
        retention: '90 days',
        sizeBytes: 245678,
      },
      {
        id: 'evidence-002',
        type: 'sbom',
        name: 'Backend SBOM (SPDX 2.3)',
        status: 'ready',
        createdAt: yesterday.toISOString(),
        createdBy: 'ci-pipeline',
        hash: 'sha256:b4f6e0d2c3b9f5e7d8a0b3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
        downloadUrl: '/api/security/artifacts/sbom-backend-20260107.xml',
        retention: '90 days',
        sizeBytes: 189432,
      },
      {
        id: 'evidence-003',
        type: 'oscal',
        name: 'OSCAL Standard Profile Scan Results',
        status: 'ready',
        createdAt: now.toISOString(),
        createdBy: 'security-scanner',
        hash: 'sha256:c5f7e1d3c4b0f6e8d9a1b4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
        downloadUrl: '/api/security/artifacts/oscal-standard-20260108.json',
        retention: '180 days',
        sizeBytes: 412890,
      },
      {
        id: 'evidence-004',
        type: 'sca',
        name: 'Dependency Audit Report',
        status: 'ready',
        createdAt: yesterday.toISOString(),
        createdBy: 'npm-audit',
        hash: 'sha256:d6f8e2d4c5b1f7e9d0a2b5c6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
        downloadUrl: '/api/security/artifacts/sca-audit-20260107.json',
        retention: '90 days',
        sizeBytes: 98234,
      },
      {
        id: 'evidence-005',
        type: 'realtime',
        name: 'Real-Time Security Test Results',
        status: 'ready',
        createdAt: now.toISOString(),
        createdBy: 'security-monitor',
        hash: 'sha256:e7f9e3d5c6b2f8e0d1a3b6c7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
        downloadUrl: '/api/security/artifacts/realtime-tests-20260108.json',
        retention: '30 days',
        sizeBytes: 45678,
      },
      {
        id: 'evidence-006',
        type: 'oscal',
        name: 'PCI-DSS Compliance Assessment',
        status: 'pending',
        createdAt: lastWeek.toISOString(),
        createdBy: 'compliance-team',
        hash: '',
        downloadUrl: '',
        retention: '365 days',
        sizeBytes: 0,
      },
    ];
  }

  private initializeSboms(): Sbom[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return [
      {
        id: 'sbom-001',
        name: 'Frontend SBOM',
        format: 'CycloneDX',
        created: now.toISOString(),
        delta: '+2 / -1',
        status: 'ready',
        components: 487,
        vulnerabilities: 3,
        downloadUrl: '/api/security/artifacts/sbom-frontend-20260108.json',
      },
      {
        id: 'sbom-002',
        name: 'Backend SBOM',
        format: 'SPDX',
        created: yesterday.toISOString(),
        delta: '+0 / -0',
        status: 'ready',
        components: 312,
        vulnerabilities: 0,
        downloadUrl: '/api/security/artifacts/sbom-backend-20260107.xml',
      },
    ];
  }

  private initializeOscalProfiles(): OscalProfile[] {
    return [
      {
        id: 'oscal-001',
        name: 'OSCAL Standard',
        status: 'pass',
        lastRun: new Date().toISOString(),
        pass: 122,
        fail: 0,
        duration: '2m 13s',
        profileType: 'baseline',
      },
      {
        id: 'oscal-002',
        name: 'OSCAL PCI-DSS',
        status: 'warn',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        pass: 117,
        fail: 3,
        duration: '2m 45s',
        profileType: 'compliance',
      },
      {
        id: 'oscal-003',
        name: 'OSCAL OSPP',
        status: 'pending',
        lastRun: '',
        pass: 0,
        fail: 0,
        duration: '-',
        profileType: 'protection',
      },
    ];
  }

  private initializeScaItems(): ScaItem[] {
    const now = new Date().toISOString();

    return [
      {
        id: 'sca-001',
        label: 'A01: Deprecated packages removed',
        status: 'pass',
        description: 'All deprecated packages have been removed from dependencies',
        lastChecked: now,
      },
      {
        id: 'sca-002',
        label: 'A02: Known CVEs triaged',
        status: 'warn',
        description: '3 known CVEs require attention in transitive dependencies',
        lastChecked: now,
      },
      {
        id: 'sca-003',
        label: 'A03: License policy enforced',
        status: 'pass',
        description: 'All dependencies comply with license policy',
        lastChecked: now,
      },
      {
        id: 'sca-004',
        label: 'A04: Outdated majors pinned',
        status: 'warn',
        description: '2 major version updates available but pinned for stability',
        lastChecked: now,
      },
      {
        id: 'sca-005',
        label: 'A05: Dev-time vs prod deps separated',
        status: 'pass',
        description: 'Development and production dependencies properly separated',
        lastChecked: now,
      },
      {
        id: 'sca-006',
        label: 'A06: Integrity (SRI hashes) tracked',
        status: 'todo',
        description: 'Subresource Integrity hashes not yet implemented',
        lastChecked: now,
      },
      {
        id: 'sca-007',
        label: 'A07: Transitives audited',
        status: 'todo',
        description: 'Manual audit of transitive dependencies pending',
        lastChecked: now,
      },
      {
        id: 'sca-008',
        label: 'A08: SBOM emitted per build',
        status: 'pass',
        description: 'Software Bill of Materials generated automatically per build',
        lastChecked: now,
      },
      {
        id: 'sca-009',
        label: 'A09: Supply-chain alerts wired',
        status: 'warn',
        description: 'GitHub Dependabot enabled but needs integration with monitoring',
        lastChecked: now,
      },
      {
        id: 'sca-010',
        label: 'A10: Artifact signing planned',
        status: 'todo',
        description: 'Code signing and artifact verification planned for future release',
        lastChecked: now,
      },
    ];
  }

  private initializeRealtimeChecks(): RealtimeCheck[] {
    const now = new Date().toISOString();

    return [
      {
        id: 'rt-001',
        name: 'CSP/XSS smoke',
        status: 'pass',
        duration: '2.1s',
        lastRun: now,
        endpoint: '/api/auth/me',
      },
      {
        id: 'rt-002',
        name: 'Rate-limit probe',
        status: 'pass',
        duration: '1.4s',
        lastRun: now,
        endpoint: '/api/auth/refresh',
      },
      {
        id: 'rt-003',
        name: 'Auth freshness',
        status: 'warn',
        duration: '1.1s',
        lastRun: now,
        endpoint: '/api/auth/status',
      },
      {
        id: 'rt-004',
        name: 'Headers (HSTS/CORS)',
        status: 'pass',
        duration: '0.9s',
        lastRun: now,
        endpoint: '/api/health',
      },
    ];
  }

  /**
   * Execute OSCAL scan with simulated progress
   */
  async executeOscalScan(
    profileId: string,
    progressCallback?: (progress: number, eta: string, message: string) => void,
  ): Promise<OscalProfile> {
    const profile = this.oscalProfiles.find((p) => p.id === profileId);
    if (!profile) {
      throw new Error(`OSCAL profile ${profileId} not found`);
    }

    // Simulate scan execution with progress updates
    const totalSteps = 10;
    for (let step = 0; step <= totalSteps; step++) {
      await this.delay(1000 + Math.random() * 1000); // 1-2 seconds per step
      
      const progress = (step / totalSteps) * 100;
      const eta = this.calculateEta(totalSteps - step, 1.5);
      const message = this.getOscalStepMessage(step);
      
      if (progressCallback) {
        progressCallback(progress, eta, message);
      }
    }

    // Update profile with new results
    profile.lastRun = new Date().toISOString();
    profile.pass = Math.floor(Math.random() * 20) + 30;
    profile.fail = Math.floor(Math.random() * 5);
    profile.status = profile.fail === 0 ? 'pass' : profile.fail > 3 ? 'fail' : 'warn';
    profile.duration = `${(totalSteps * 1.5).toFixed(1)}s`;

    return profile;
  }

  /**
   * Execute real-time security check
   */
  async executeRealtimeCheck(
    checkId: string,
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<RealtimeCheck> {
    const check = this.realtimeChecks.find((c) => c.id === checkId);
    if (!check) {
      throw new Error(`Real-time check ${checkId} not found`);
    }

    // Simulate check execution
    const steps = ['Connecting...', 'Authenticating...', 'Running test...', 'Validating...', 'Complete'];
    for (let i = 0; i < steps.length; i++) {
      await this.delay(300 + Math.random() * 700);
      const progress = ((i + 1) / steps.length) * 100;
      
      if (progressCallback) {
        progressCallback(progress, steps[i] || '');
      }
    }

    // Update check results
    check.lastRun = new Date().toISOString();
    check.status = Math.random() > 0.2 ? 'pass' : Math.random() > 0.5 ? 'warn' : 'fail';
    check.duration = `${(steps.length * 0.5).toFixed(1)}s`;

    return check;
  }

  /**
   * Generate SBOM report data
   */
  getSbomReport(sbomId: string): Sbom {
    const sbom = this.sboms.find((s) => s.id === sbomId);
    if (!sbom) {
      throw new Error(`SBOM ${sbomId} not found`);
    }
    return sbom;
  }

  /**
   * Get OSCAL profile report data
   */
  getOscalReport(profileId: string): OscalProfile {
    const profile = this.oscalProfiles.find((p) => p.id === profileId);
    if (!profile) {
      throw new Error(`OSCAL profile ${profileId} not found`);
    }
    return profile;
  }

  /**
   * Get all findings for export
   */
  getFindingsReport(): SecurityFinding[] {
    return this.findings;
  }

  /**
   * Get all evidence for bundle export
   */
  getEvidenceBundle(): SecurityEvidence[] {
    return this.evidence;
  }

  /**
   * Get SCA report data
   */
  getScaReport(): ScaItem[] {
    return this.scaItems;
  }

  /**
   * Get realtime check report
   */
  getRealtimeReport(checkId: string): RealtimeCheck {
    const check = this.realtimeChecks.find((c) => c.id === checkId);
    if (!check) {
      throw new Error(`Real-time check ${checkId} not found`);
    }
    return check;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateEta(stepsRemaining: number, avgTimePerStep: number): string {
    const seconds = Math.ceil(stepsRemaining * avgTimePerStep);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  private getOscalStepMessage(step: number): string {
    const messages = [
      'Initializing scan environment...',
      'Loading control families...',
      'Assessing access controls (AC)...',
      'Validating audit procedures (AU)...',
      'Checking incident response (IR)...',
      'Reviewing risk assessment (RA)...',
      'Verifying system integrity (SI)...',
      'Testing configuration management (CM)...',
      'Analyzing security planning (PL)...',
      'Generating compliance report...',
      'Scan complete',
    ];
    return messages[step] || 'Processing...';
  }
}
