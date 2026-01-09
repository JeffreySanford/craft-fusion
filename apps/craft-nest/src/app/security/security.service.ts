import { Injectable } from '@nestjs/common';

export interface SecurityFinding {
  id: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  component?: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface SecurityEvidence {
  id: string;
  type: 'oscal' | 'sca' | 'sbom' | 'realtime';
  name: string;
  status: 'ready' | 'pending';
  createdAt: string;
  createdBy?: string;
  hash?: string;
  downloadUrl?: string;
}

@Injectable()
export class SecurityService {
  getFindings(): SecurityFinding[] {
    return [
      {
        id: 'finding-001',
        source: 'oscal',
        severity: 'medium',
        title: 'Access control review pending',
        component: 'rbac',
        status: 'open',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'finding-002',
        source: 'sca',
        severity: 'low',
        title: 'Dependency audit scheduled',
        component: 'supply-chain',
        status: 'open',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  getEvidence(): SecurityEvidence[] {
    return [
      {
        id: 'evidence-001',
        type: 'sbom',
        name: 'Frontend SBOM (CycloneDX)',
        status: 'ready',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        hash: 'pending',
        downloadUrl: '',
      },
    ];
  }
}
