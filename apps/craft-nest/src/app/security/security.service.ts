import { Injectable } from '@nestjs/common';
import * as securityControlsData from './security-controls.json';

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

export interface OscalControlResult {
  id: string;
  title: string;
  status: 'pass' | 'fail' | 'notapplicable' | 'notchecked';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  recommendation?: string;
  evidence?: string;
  reference?: string;
  category?: string;
  timestamp?: string;
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
  description?: string;
  total?: number;
  notapplicable?: number;
  controlResults?: OscalControlResult[];
}

export interface OscalUpdateSource {
  version: string;
  status: 'synced' | 'pending' | 'stale';
  lastChecked: string;
  note?: string;
}
export interface OscalUpdateStatus {
  lastUpdated: string;
  sources: {
    fedramp: OscalUpdateSource;
    nist: OscalUpdateSource;
  };
  progress: {
    status: 'idle' | 'in-progress' | 'error';
    value: number;
    message: string;
  };
}

export interface ScaCheckResult {
  id: string;
  title: string;
  status: 'pass' | 'fail' | 'warning';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  recommendation?: string;
  reference?: string;
  evidence?: string;
  timestamp?: string;
}

export interface ScaItem {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'todo';
  description?: string;
  lastChecked?: string;
  pass?: number;
  fail?: number;
  warning?: number;
  total?: number;
  checkResults?: ScaCheckResult[];
}

export interface RealtimeCheckResult {
  id: string;
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  responseTime?: number;
  statusCode?: number;
  message?: string;
  recommendation?: string;
  details?: string;
  timestamp?: string;
}

export interface RealtimeCheck {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  duration: string;
  lastRun?: string;
  endpoint?: string;
  pass?: number;
  fail?: number;
  warning?: number;
  total?: number;
  testResults?: RealtimeCheckResult[];
}

@Injectable()
export class SecurityService {
  private readonly controlsDatabase = (securityControlsData as any).controls;
  private readonly controlsMetadata = (securityControlsData as any).metadata;
  private findings: SecurityFinding[] = this.initializeFindings();
  private evidence: SecurityEvidence[] = this.initializeEvidence();
  private sboms: Sbom[] = this.initializeSboms();
  private oscalProfiles: OscalProfile[] = this.initializeOscalProfiles();
  private scaItems: ScaItem[] = this.initializeScaItems();
  private realtimeChecks: RealtimeCheck[] = this.initializeRealtimeChecks();
  private oscalUpdateStatus: OscalUpdateStatus = {
    lastUpdated: new Date().toISOString(),
    sources: {
      fedramp: {
        version: this.controlsMetadata?.compliancePrograms?.fedramp?.version || 'Rev 5',
        status: 'synced',
        lastChecked: new Date().toISOString(),
        note: 'Baseline data retrieved from FedRAMP Rev 5 catalog'
      },
      nist: {
        version: this.controlsMetadata?.compliancePrograms?.rmf?.version || 'SP 800-37 Rev 2',
        status: 'synced',
        lastChecked: new Date().toISOString(),
        note: 'Aligned to NIST RMF Rev 5 control catalog'
      }
    },
    progress: {
      status: 'idle',
      value: 100,
      message: 'Catalogs match the current Rev 5 baselines.'
    }
  };

  getFindings(): SecurityFinding[] {
    return this.findings;
  }

  getControlsDatabase() {
    return {
      controls: this.controlsDatabase,
      metadata: (securityControlsData as any).metadata
    };
  }

  getControl(controlId: string) {
    const control = this.controlsDatabase[controlId];
    if (!control) {
      throw new Error(`Control ${controlId} not found in database`);
    }
    return control;
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

  getOscalUpdateStatus(): OscalUpdateStatus {
    return this.oscalUpdateStatus;
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
      {
        id: 'fedramp-moderate',
        name: 'FedRAMP Moderate Baseline',
        status: 'fail',
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        pass: 245,
        fail: 23,
        duration: '8m 34s',
        profileType: 'compliance',
        description: 'FedRAMP Rev 5 Moderate Impact Level (325 controls)'
      },
      {
        id: 'fedramp-high',
        name: 'FedRAMP High Baseline',
        status: 'pending',
        lastRun: '',
        pass: 0,
        fail: 0,
        duration: '-',
        profileType: 'compliance',
        description: 'FedRAMP Rev 5 High Impact Level (421 controls)'
      },
      {
        id: 'nist-rmf-800-53',
        name: 'NIST RMF 800-53 Rev 5',
        status: 'warn',
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        pass: 312,
        fail: 18,
        duration: '12m 21s',
        profileType: 'baseline',
        description: 'NIST SP 800-53 Rev 5 Security and Privacy Controls'
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

    // Generate detailed control results
    const controlResults: OscalControlResult[] = [];
    const controlIds = this.getControlIdsForProfile(profileId);
    
    let passCount = 0;
    let failCount = 0;
    let notApplicableCount = 0;
    
    for (const controlId of controlIds) {
      const random = Math.random();
      let status: 'pass' | 'fail' | 'notapplicable';
      
      if (random < 0.1) {
        status = 'notapplicable';
        notApplicableCount++;
      } else if (random < 0.25) {
        status = 'fail';
        failCount++;
      } else {
        status = 'pass';
        passCount++;
      }
      
      // Get full control details from database
      const control = this.getControl(controlId);
      
      const controlResult: OscalControlResult = {
        id: controlId,
        title: this.getControlTitle(controlId),
        status,
        timestamp: new Date().toISOString(),
        severity: control?.severity || this.getRandomSeverity(),
        description: this.getControlDescription(controlId),
        recommendation: this.getControlRemediation(controlId),
        evidence: this.getControlEvidence(controlId)
      };
      
      // Add references if available from database
      if (control?.references && control.references.length > 0) {
        controlResult.reference = control.references.join(', ');
      }
      
      // Add category/framework info if available
      if (control?.category) {
        controlResult.category = control.category;
      }
      
      controlResults.push(controlResult);
    }

    // Update profile with new results
    profile.lastRun = new Date().toISOString();
    profile.pass = passCount;
    profile.fail = failCount;
    profile.notapplicable = notApplicableCount;
    profile.total = controlIds.length;
    profile.status = failCount === 0 ? 'pass' : failCount > 3 ? 'fail' : 'warn';
    profile.duration = `${(totalSteps * 1.5).toFixed(1)}s`;
    profile.controlResults = controlResults;

    return profile;
  }

  async refreshOscalUpdates(): Promise<OscalUpdateStatus> {
    const status = this.oscalUpdateStatus;
    const now = new Date().toISOString();
    status.progress = {
      status: 'in-progress',
      value: 20,
      message: 'Checking official OSCAL catalogs for updates...'
    };
    status.sources.fedramp.status = 'pending';
    status.sources.nist.status = 'pending';
    await this.delay(250);
    status.progress = {
      status: 'in-progress',
      value: 60,
      message: 'Comparing FedRAMP and NIST baselines...'
    };
    await this.delay(250);
    status.sources.fedramp.lastChecked = now;
    status.sources.nist.lastChecked = now;
    status.sources.fedramp.status = 'synced';
    status.sources.nist.status = 'synced';
    status.lastUpdated = now;
    status.progress = {
      status: 'idle',
      value: 100,
      message: 'Catalogs aligned with latest Rev 5 baselines.'
    };
    return status;
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

    // Generate detailed test results
    const testResults: RealtimeCheckResult[] = [];
    const testNames = this.getRealtimeTestsForCheck(checkId);
    
    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;
    
    for (const testName of testNames) {
      const random = Math.random();
      let status: 'pass' | 'fail' | 'warning';
      
      if (random < 0.15) {
        status = 'fail';
        failCount++;
      } else if (random < 0.25) {
        status = 'warning';
        warningCount++;
      } else {
        status = 'pass';
        passCount++;
      }
      
      const testResult: RealtimeCheckResult = {
        id: `${checkId}-${testName}`,
        testName,
        status,
        responseTime: Math.floor(Math.random() * 500) + 50,
        statusCode: status === 'fail' ? (Math.random() > 0.5 ? 500 : 403) : 200,
        message: this.getRealtimeTestMessage(testName, status),
        timestamp: new Date().toISOString(),
        severity: this.getRandomSeverity(),
        recommendation: this.getRealtimeTestRemediation(testName),
        details: this.getRealtimeTestDetails(testName)
      };
      
      testResults.push(testResult);
    }

    // Update check results
    check.lastRun = new Date().toISOString();
    check.pass = passCount;
    check.fail = failCount;
    check.warning = warningCount;
    check.total = testNames.length;
    check.status = failCount > 0 ? 'fail' : warningCount > 0 ? 'warn' : 'pass';
    check.duration = `${(steps.length * 0.5).toFixed(1)}s`;
    check.testResults = testResults;

    return check;
  }

  /**
   * Execute SCA item check
   */
  async executeScaCheck(
    itemId: string,
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<ScaItem> {
    const item = this.scaItems.find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`SCA item ${itemId} not found`);
    }

    // Simulate check execution
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      await this.delay(400 + Math.random() * 600);
      const progress = ((i + 1) / steps) * 100;
      
      if (progressCallback) {
        progressCallback(progress, `Checking ${item.label}...`);
      }
    }

    // Generate detailed check results
    const checkResults: ScaCheckResult[] = [];
    const checks = this.getScaChecksForItem(itemId);
    
    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;
    
    for (const checkTitle of checks) {
      const random = Math.random();
      let status: 'pass' | 'fail' | 'warning';
      
      if (random < 0.2) {
        status = 'fail';
        failCount++;
      } else if (random < 0.35) {
        status = 'warning';
        warningCount++;
      } else {
        status = 'pass';
        passCount++;
      }
      
      const checkResult: ScaCheckResult = {
        id: `${itemId}-${checkTitle.replace(/\s+/g, '-').toLowerCase()}`,
        title: checkTitle,
        status,
        timestamp: new Date().toISOString(),
        severity: this.getRandomSeverity(),
        description: this.getScaCheckDescription(checkTitle, status),
        recommendation: this.getScaCheckRemediation(checkTitle),
        reference: this.getScaCheckReference(checkTitle),
        evidence: this.getScaCheckEvidence(checkTitle)
      };
      
      checkResults.push(checkResult);
    }

    // Update item results
    item.lastChecked = new Date().toISOString();
    item.pass = passCount;
    item.fail = failCount;
    item.warning = warningCount;
    item.total = checks.length;
    item.status = failCount > 0 ? 'fail' : warningCount > 0 ? 'warn' : 'pass';
    item.checkResults = checkResults;

    return item;
  }

  private getScaChecksForItem(itemId: string): string[] {
    const itemChecks: Record<string, string[]> = {
      'sca-1': ['Broken Access Control - Elevation of Privilege', 'Missing Function Level Access Control', 'Insecure Direct Object References'],
      'sca-2': ['Weak Password Requirements', 'Improper Session Management', 'Missing MFA', 'Credential Storage'],
      'sca-3': ['SQL Injection Prevention', 'XSS Prevention', 'Command Injection Protection', 'Path Traversal Protection'],
      'sca-4': ['Secure Design Principles', 'Threat Modeling', 'Security Requirements'],
      'sca-5': ['Default Credentials', 'Hardcoded Secrets', 'Security Headers', 'Error Handling'],
      'sca-6': ['Known Vulnerable Components', 'Outdated Libraries', 'Unpatched Dependencies'],
      'sca-7': ['Authentication Strength', 'Password Complexity', 'Account Lockout', 'Session Token Entropy'],
      'sca-8': ['Data Integrity Checks', 'Software Update Verification', 'CI/CD Security'],
      'sca-9': ['Security Logging', 'Monitoring Coverage', 'Incident Response', 'Audit Trail'],
      'sca-10': ['SSRF Protection', 'Server-Side Validation', 'Input Sanitization']
    };
    
    return itemChecks[itemId] || ['Generic Security Check'];
  }

  private getScaCheckRemediation(checkTitle: string): string {
    const remediations: Record<string, string> = {
      'Broken Access Control - Elevation of Privilege': 'Implement proper role-based access control (RBAC) and enforce principle of least privilege',
      'SQL Injection Prevention': 'Use parameterized queries or prepared statements for all database operations',
      'Known Vulnerable Components': 'Update all dependencies to latest secure versions and implement automated vulnerability scanning',
      'Security Logging': 'Implement comprehensive logging of all security events with proper retention policies'
    };
    
    return remediations[checkTitle] || `Address security issue in ${checkTitle}`;
  }

  private getScaCheckReference(checkTitle: string): string {
    return `OWASP Top 10 - See security documentation for ${checkTitle.toLowerCase()}`;
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

  private getRealtimeTestsForCheck(checkId: string): string[] {
    const checkTests: Record<string, string[]> = {
      'rt-1': ['TLS Version Check', 'Certificate Validation', 'Cipher Strength', 'HSTS Header'],
      'rt-2': ['Session Cookie Secure', 'HttpOnly Flag', 'SameSite Attribute', 'Session Timeout'],
      'rt-3': ['CSP Header', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy'],
      'rt-4': ['CORS Configuration', 'Origin Validation', 'Preflight Handling'],
      'rt-5': ['Rate Limiting', 'DDoS Protection', 'IP Blacklisting']
    };
    
    return checkTests[checkId] || ['Generic Security Test'];
  }

  private getRealtimeTestMessage(testName: string, status: 'pass' | 'fail' | 'warning'): string {
    if (status === 'pass') {
      return `${testName} completed successfully - all security requirements met`;
    } else if (status === 'warning') {
      return `${testName} passed with warnings - review configuration for optimization`;
    } else {
      return `${testName} failed - security requirement not met`;
    }
  }

  private getRealtimeTestRemediation(testName: string): string {
    const remediations: Record<string, string> = {
      'TLS Version Check': 'Upgrade to TLS 1.3 and disable TLS 1.0/1.1',
      'Certificate Validation': 'Ensure SSL certificate is valid and not expired',
      'Session Cookie Secure': 'Set Secure flag on all session cookies',
      'CSP Header': 'Implement Content-Security-Policy header with strict directives',
      'CORS Configuration': 'Review and restrict CORS allowed origins'
    };
    
    return remediations[testName] || `Review and update ${testName} configuration`;
  }

  private getControlIdsForProfile(profileId: string): string[] {
    const profileControls: Record<string, string[]> = {
      'xccdf_org.ssgproject.content_profile_pci-dss': [
        'PCI-DSS-Req-1.1', 'PCI-DSS-Req-1.2', 'PCI-DSS-Req-2.1', 'PCI-DSS-Req-2.2',
        'PCI-DSS-Req-3.1', 'PCI-DSS-Req-3.4', 'PCI-DSS-Req-4.1', 'PCI-DSS-Req-5.1',
        'PCI-DSS-Req-6.1', 'PCI-DSS-Req-6.5', 'PCI-DSS-Req-7.1', 'PCI-DSS-Req-8.1',
        'PCI-DSS-Req-8.2', 'PCI-DSS-Req-8.5', 'PCI-DSS-Req-9.1', 'PCI-DSS-Req-10.1',
        'PCI-DSS-Req-10.2', 'PCI-DSS-Req-11.1', 'PCI-DSS-Req-12.1'
      ],
      'xccdf_org.ssgproject.content_profile_standard': [
        'BASELINE-1', 'BASELINE-2', 'BASELINE-3', 'BASELINE-4', 'BASELINE-5',
        'BASELINE-6', 'BASELINE-7', 'BASELINE-8', 'BASELINE-9', 'BASELINE-10'
      ],
      'xccdf_org.ssgproject.content_profile_ospp': [
        'OSPP-AC-1', 'OSPP-AC-2', 'OSPP-AU-1', 'OSPP-AU-2', 'OSPP-CM-1',
        'OSPP-IA-1', 'OSPP-IA-2', 'OSPP-SC-1', 'OSPP-SC-2', 'OSPP-SI-1'
      ],
      'fedramp-moderate': [
        'FEDRAMP-AC-2', 'FEDRAMP-AU-6', 'FEDRAMP-IA-2', 'FEDRAMP-SC-7', 'FEDRAMP-SI-2',
        'FEDRAMP-CA-2', 'FEDRAMP-IR-4', 'FEDRAMP-MA-4', 'FEDRAMP-CP-9', 'FEDRAMP-PL-2',
        'FEDRAMP-RA-3', 'FEDRAMP-SI-4', 'FEDRAMP-AC-17', 'FEDRAMP-AC-19', 'FEDRAMP-SC-8',
        'BASELINE-1', 'BASELINE-2', 'BASELINE-3', 'BASELINE-5', 'BASELINE-6',
        'BASELINE-7', 'BASELINE-8', 'BASELINE-9', 'CTRL-1', 'CTRL-2', 'CTRL-4', 'CTRL-5'
      ],
      'fedramp-high': [
        'FEDRAMP-AC-2', 'FEDRAMP-AU-6', 'FEDRAMP-IA-2', 'FEDRAMP-SC-7', 'FEDRAMP-SI-2',
        'FEDRAMP-CA-2', 'FEDRAMP-IR-4', 'FEDRAMP-MA-4', 'FEDRAMP-CP-9', 'FEDRAMP-PL-2',
        'FEDRAMP-RA-3', 'FEDRAMP-SI-4', 'FEDRAMP-AC-17', 'FEDRAMP-AC-19', 'FEDRAMP-SC-8',
        'RMF-CA-7', 'RMF-PM-9', 'RMF-SA-11', 'RMF-RA-5', 'RMF-SC-28',
        'BASELINE-1', 'BASELINE-2', 'BASELINE-3', 'BASELINE-4', 'BASELINE-5',
        'BASELINE-6', 'BASELINE-7', 'BASELINE-8', 'BASELINE-9', 'BASELINE-10',
        'CTRL-1', 'CTRL-2', 'CTRL-3', 'CTRL-4', 'CTRL-5'
      ],
      'nist-rmf-800-53': [
        'RMF-CA-2', 'RMF-IR-4', 'RMF-MA-4', 'RMF-CP-9', 'RMF-PL-2',
        'RMF-RA-3', 'RMF-SI-4', 'RMF-AC-17', 'RMF-AC-19', 'RMF-SC-8',
        'RMF-CA-7', 'RMF-PM-9', 'RMF-SA-11', 'RMF-RA-5', 'RMF-SC-28',
        'BASELINE-1', 'BASELINE-2', 'BASELINE-3', 'BASELINE-4', 'BASELINE-5',
        'BASELINE-6', 'BASELINE-7', 'BASELINE-8', 'BASELINE-9', 'BASELINE-10',
        'CTRL-1', 'CTRL-2', 'CTRL-3', 'CTRL-4', 'CTRL-5'
      ]
    };
    
    return profileControls[profileId] || ['CTRL-1', 'CTRL-2', 'CTRL-3', 'CTRL-4', 'CTRL-5'];
  }

  private getControlTitle(controlId: string): string {
    const control = this.controlsDatabase[controlId];
    return control?.title || `Control ${controlId}`;
  }

  private getControlDescription(controlId: string): string {
    const control = this.controlsDatabase[controlId];
    return control?.description || `Evaluation of security control ${controlId} found non-compliance with required standards. This control is essential for maintaining security posture.`;
  }

  private getControlRemediation(controlId: string): string {
    const control = this.controlsDatabase[controlId];
    return control?.remediation || `Review and update configuration for ${controlId} to meet compliance requirements. Implement compensating controls if direct remediation is not feasible. Document all remediation actions in change management system.`;
  }

  private getControlEvidence(controlId: string): string {
    const control = this.controlsDatabase[controlId];
    return control?.evidence || `System configuration analysis revealed non-compliant settings. Review logs at /var/log/security/${controlId.toLowerCase()}.log for details. Automated compliance scan timestamp: ${new Date().toISOString()}. Recommended next steps: Conduct manual verification, implement remediation plan, re-scan for validation.`;
  }

  private getRandomSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const random = Math.random();
    if (random < 0.1) return 'critical';
    if (random < 0.3) return 'high';
    if (random < 0.7) return 'medium';
    return 'low';
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

  private getRealtimeTestDetails(testName: string): string {
    const details: Record<string, string> = {
      'TLS Version Check': 'Validates TLS protocol version support and ensures deprecated versions are disabled.',
      'Certificate Validation': 'Verifies SSL/TLS certificate validity, expiration, and chain of trust.',
      'Session Cookie Secure': 'Ensures session cookies have Secure, HttpOnly, and SameSite flags properly configured.',
      'CSP Header': 'Validates Content-Security-Policy implementation and directive strictness.',
      'CORS Configuration': 'Checks Cross-Origin Resource Sharing policy for security misconfigurations.'
    };
    
    return details[testName] || `Security test for ${testName}`;
  }

  private getScaCheckDescription(checkTitle: string, status: string): string {
    const descriptions: Record<string, string> = {
      'Broken Access Control - Elevation of Privilege': 'User privilege escalation possible due to improper access control implementation.',
      'SQL Injection Prevention': 'Database queries vulnerable to SQL injection attacks through unsanitized user input.',
      'Known Vulnerable Components': 'Application dependencies include libraries with known security vulnerabilities.',
      'Security Logging': 'Insufficient logging of security-relevant events for audit and incident response.'
    };
    
    if (status === 'pass') {
      return `${checkTitle} - All security requirements met`;
    } else if (status === 'warning') {
      return `${checkTitle} - Security control needs attention or optimization`;
    }
    
    return descriptions[checkTitle] || `Security control ${checkTitle} is not properly configured`;
  }

  private getScaCheckEvidence(checkTitle: string): string {
    const evidence: Record<string, string> = {
      'Broken Access Control - Elevation of Privilege': 'Code review found missing authorization checks in /api/admin/* endpoints. RBAC middleware not enforced on 12 critical routes.',
      'SQL Injection Prevention': 'Static analysis detected 8 instances of string concatenation in SQL queries. Files: user.service.ts:145, data.repository.ts:89, auth.controller.ts:234.',
      'Known Vulnerable Components': 'npm audit found 15 vulnerabilities: 3 high, 7 moderate, 5 low. Dependencies: express@4.17.1, lodash@4.17.19, axios@0.21.1.',
      'Security Logging': 'Log analysis shows only 40% of authentication events captured. Missing logs for: password changes, role modifications, admin actions.'
    };
    
    return evidence[checkTitle] || `Automated security scan identified compliance gaps in ${checkTitle}. Review scan logs for details.`;
  }
}
