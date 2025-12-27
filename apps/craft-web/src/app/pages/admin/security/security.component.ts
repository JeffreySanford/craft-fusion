import { Component } from '@angular/core';
import { SecurityScanService } from '../../../common/services/security-scan.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AdminMetricsService } from '../../../common/services/admin-metrics.service';
import { AuthenticationService } from '../../../common/services/authentication.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-admin-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
  standalone: false
})

export class AdminSecurityComponent {
  latest: any = null;
  jobLogs: any[] = [];
  runningJob: any = null;
  activeUsers: number = 1;
  permissionRequests: number = 3;
  sessionSecurity: string = 'Protected';
  connection: string = 'Secure';
  features: Array<{icon: string; title: string; status: string; value?: string}> = [
    { icon: 'filter_list', title: 'Request Filtering', status: 'Active' },
    { icon: 'lock_clock', title: 'Session Timeout', status: 'Active', value: '30 min' },
    { icon: 'security', title: 'SSL Protection', status: 'Active', value: 'TLS 1.3' },
    { icon: 'fingerprint', title: '2FA', status: 'Inactive' },
    { icon: 'vpn_lock', title: 'IP Filtering', status: 'Inactive' },
    { icon: 'privacy_tip', title: 'Data Encryption', status: 'Active', value: 'AES-256' }
  ];
  private destroy$ = new Subject<void>();

  constructor(private scanService: SecurityScanService, private metrics: AdminMetricsService, private auth: AuthenticationService) {
    this.refreshLatest();
    this.loadMetrics();
    this.auth.isLoggedIn$.pipe(take(1)).subscribe(isLoggedIn => {
      this.sessionSecurity = isLoggedIn ? 'Protected' : 'Public';
    });
  }

  loadMetrics() {
    this.metrics.getMetrics().pipe(take(1)).subscribe(m => {
      this.activeUsers = m.activeUsers;
      this.permissionRequests = m.permissionRequests;
      this.connection = m.connection;
    });
  }

  refreshLatest() {
    this.scanService.getLatest().subscribe(res => (this.latest = res));
  }

  runSCA() {
    this.scanService.startScan({ type: 'sca', scope: 'repo' }).subscribe(r => {
      const jobId = r.jobId;
      this.runningJob = { jobId, progress: 0 };
      this.jobLogs = [];
      this.scanService.watchJob(jobId).pipe(takeUntil(this.destroy$)).subscribe(msg => {
        this.jobLogs.push(msg);
        if (msg.progress) this.runningJob.progress = msg.progress;
        if (msg.event === 'finished' || msg.event === 'failed') {
          this.refreshLatest();
          this.runningJob = null;
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
