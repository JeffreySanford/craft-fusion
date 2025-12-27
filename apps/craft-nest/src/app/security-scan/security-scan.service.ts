import { Injectable, Logger } from '@nestjs/common';
import { StartScanDto } from './dtos/start-scan.dto';
import { ScanJobStatusDto } from './dtos/scan-status.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { SocketGateway } from '../socket/socket.gateway';

export interface ScanJob extends ScanJobStatusDto {
  result?: any;
  artifacts?: Array<{ type: string; path: string }>;
}

@Injectable()
export class SecurityScanService {
  private readonly logger = new Logger(SecurityScanService.name);
  private queue: ScanJob[] = [];
  private jobs = new Map<string, ScanJob>();
  private processing = false;
  private storageRoot = path.join(process.cwd(), 'storage', 'security');

  constructor(private readonly socketGateway: SocketGateway) {
    fs.mkdirSync(this.storageRoot, { recursive: true });
  }

  enqueue(dto: StartScanDto, user?: any) {
    const jobId = uuidv4();
    const job: ScanJob = {
      jobId,
      type: dto.type,
      scope: dto.scope,
      state: 'queued',
      progress: 0,
      message: 'Queued'
    };

    this.jobs.set(jobId, job);
    this.queue.push(job);
    this.emitEvent('security:job', { event: 'queued', jobId });
    this.logger.log(`Enqueued security scan ${jobId} (${dto.type}/${dto.scope}) by ${user?.username || 'system'}`);
    this.processNext();
    return { jobId };
  }

  getStatus(jobId: string): ScanJob | null {
    return this.jobs.get(jobId) ?? null;
  }

  getLatest(): any {
    // return last completed job summary
    const jobs = Array.from(this.jobs.values()).filter(j => j.state === 'done');
    return jobs.length ? jobs[jobs.length - 1] : null;
  }

  private async processNext() {
    if (this.processing) return;
    const job = this.queue.shift();
    if (!job) return;
    this.processing = true;
    job.state = 'running';
    job.startedAt = new Date().toISOString();
    job.progress = 0;
    job.message = 'Starting';
    this.emitEvent('security:job', { event: 'started', jobId: job.jobId });

    try {
      await this.runFakeScan(job);
      job.state = 'done';
      job.progress = 100;
      job.finishedAt = new Date().toISOString();
      job.message = 'Completed';
      // persist metadata
      this.persistJob(job);
      this.emitEvent('security:job', { event: 'finished', jobId: job.jobId, summary: job.result });
    } catch (e) {
      this.logger.error('Scan job failed', e as any);
      job.state = 'failed';
      job.message = (e as any)?.message || 'failed';
      job.finishedAt = new Date().toISOString();
      this.emitEvent('security:job', { event: 'failed', jobId: job.jobId, message: job.message });
    } finally {
      this.processing = false;
      // schedule next
      setImmediate(() => this.processNext());
    }
  }

  private async runFakeScan(job: ScanJob) {
    // For MVP, simulate progress and generate a fake Top 10
    for (let i = 1; i <= 10; i++) {
      job.progress = i * 10;
      job.message = `Scanning... ${job.progress}%`;
      this.emitEvent('security:job', { event: 'progress', jobId: job.jobId, progress: job.progress, message: job.message });
      // simulate work per step
      await new Promise(res => setTimeout(res, 250));
    }

    // create a fake summary
    job.result = {
      summary: { critical: 1, high: 2, medium: 5, low: 2 },
      topFindings: Array.from({ length: 10 }).map((_, idx) => ({
        id: `CVE-FAKE-${idx + 1}`,
        package: `pkg-${idx + 1}`,
        version: `1.0.${idx}`,
        severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 4)],
        description: 'Simulated vulnerability for MVP'
      }))
    };

    // write artifacts
    const jobDir = path.join(this.storageRoot, job.jobId);
    fs.mkdirSync(jobDir, { recursive: true });
    const metaPath = path.join(jobDir, 'meta.json');
    fs.writeFileSync(metaPath, JSON.stringify({ job, result: job.result }, null, 2));
    job.artifacts = [{ type: 'meta', path: metaPath }];
  }

  private persistJob(job: ScanJob) {
    try {
      const jobsPath = path.join(this.storageRoot, 'jobs.json');
      const existing = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, 'utf8')) : [];
      existing.push({ jobId: job.jobId, type: job.type, scope: job.scope, state: job.state, startedAt: job.startedAt, finishedAt: job.finishedAt });
      fs.writeFileSync(jobsPath, JSON.stringify(existing, null, 2));
    } catch (e) {
      this.logger.warn('Failed to persist job metadata', (e as any)?.message);
    }
  }

  private emitEvent(event: string, payload: any) {
    try {
      if (this.socketGateway && this.socketGateway.server) {
        this.socketGateway.server.emit(event, payload);
      }
    } catch (e) {
      this.logger.warn('Failed to emit socket event', (e as any)?.message);
    }
  }
}
