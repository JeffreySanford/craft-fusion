export class ScanJobStatusDto {
  jobId!: string;
  type!: string;
  scope!: string;
  state!: 'queued' | 'running' | 'done' | 'failed';
  startedAt?: string;
  finishedAt?: string;
  progress?: number; // 0..100
  message?: string;
}
