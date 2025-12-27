export type ScanType = 'sbom' | 'sca' | 'sbom-scan';
export type ScanScope = 'repo' | 'container';

export class StartScanDto {
  type!: ScanType;
  scope!: ScanScope;
}
