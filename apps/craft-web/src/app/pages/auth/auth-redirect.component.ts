import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../common/services/auth/authentication.service';
import { LoggerService } from '../../common/services/logger.service';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-auth-redirect',
  standalone: false,
  template: `
    <div class="auth-redirect-shell">
      <span>{{ statusMessage }}</span>
      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>
    </div>
  `,
  styles: [
    `
      .auth-redirect-shell {
        height: calc(100vh - 160px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 1rem;
        color: #ffffff;
        background: linear-gradient(135deg, #001f3f, #002e5b);
      }
      .auth-redirect-shell mat-progress-bar {
        width: 220px;
      }
    `,
  ],
})
export class AuthRedirectComponent implements OnInit, OnDestroy {
  loading = false;
  statusMessage = 'Signing you in as valued-member.';
  private destroyed$ = new Subject<void>();
  private loginMode: 'user' | 'admin' = 'user';
  private retryCount = 0;
  private readonly maxRetries = 2;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthenticationService,
    private readonly logger: LoggerService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.determineLoginMode();
    this.performAutoLogin();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private determineLoginMode(): void {
    const mode = this.route.snapshot.paramMap.get('mode')?.toLowerCase();
    this.loginMode = mode === 'test' || mode === 'admin' ? 'admin' : 'user';
  }

  private performAutoLogin(): void {
    const username = 'valued-member';
    const roles = this.loginMode === 'admin' ? ['test', 'admin'] : ['user'];
    this.loading = true;
    this.statusMessage =
      this.loginMode === 'admin'
        ? 'Signing you in with elevated privileges.'
        : 'Signing you in as valued-member.';

    this.retryCount = 0;
    this.attemptLogin(username, roles);
  }

  private attemptLogin(username: string, roles: string[]): void {
    this.authService
      .login(username, '')
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroyed$),
      )
      .subscribe({
        next: () => {
          this.logger.info('Automatic login completed', { username, mode: this.loginMode });
          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          if (this.shouldRetry(error)) {
            this.retryCount += 1;
            this.statusMessage = 'Retrying authentication…';
            setTimeout(() => this.attemptLogin(username, roles), 600);
            return;
          }
          this.logger.warn('Automatic login failed', { error });
          this.statusMessage = 'Login failed; please refresh to retry.';
        },
      });
  }

  private shouldRetry(error: HttpErrorResponse): boolean {
    return error?.status === 401 && this.retryCount < this.maxRetries;
  }
}
