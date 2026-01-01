import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoggerService } from './logger.service';

export interface UserActivity {
  timestamp: number;
  type: 'pageview' | 'click' | 'scroll' | 'input' | 'hover' | 'other';
  target?: string;
  value?: unknown;
  page?: string;
  position?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserActivityService {
  private userActivities: UserActivity[] = [];
  private sessionStartTime = Date.now();
  private lastActivityTime = Date.now();
  private pageViewDurations: { [page: string]: number } = {};
  private currentPage = '';

  constructor(
    private router: Router,
    private logger: LoggerService,
  ) {
    this.initRouterTracking();
    this.initUserInteractionTracking();
    this.startTrackingNavigation();                              

    this.logger.info('User activity tracking initialized');
  }

  private initRouterTracking(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(evt => {
      const event = evt as NavigationEnd;
      const now = Date.now();

      if (this.currentPage) {
        this.pageViewDurations[this.currentPage] = (this.pageViewDurations[this.currentPage] || 0) + (now - this.lastActivityTime);
      }

      this.lastActivityTime = now;
      this.currentPage = event.urlAfterRedirects;

      this.trackActivity('pageview', {
        page: event.urlAfterRedirects,
      });

      this.logger.info(`User navigated to ${event.urlAfterRedirects}`);
    });
  }

  private initUserInteractionTracking(): void {

    document.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      this.trackActivity('click', {
        target: this.getElementDescription(target),
        page: this.currentPage,
      });
    });

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    document.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout as unknown as number);
      }

      scrollTimeout = setTimeout(() => {
        this.trackActivity('scroll', {
          position: window.scrollY,
          page: this.currentPage,
        });
      }, 300);
    });

    let inputTimeout: ReturnType<typeof setTimeout> | null = null;
    document.addEventListener('input', event => {
      if (inputTimeout) {
        clearTimeout(inputTimeout as unknown as number);
      }

      inputTimeout = setTimeout(() => {
        const target = event.target as HTMLInputElement | null;
        this.trackActivity('input', {
          target: this.getElementDescription(target),
          page: this.currentPage,
        });
      }, 500);
    });
  }

  private getElementDescription(element: HTMLElement | null): string {
    if (!element) return 'unknown';

    if (element.id) {
      return `#${element.id}`;
    } else if (element.classList && element.classList.length) {
      return `.${Array.from(element.classList).join('.')}`;
    } else {
      return element.tagName.toLowerCase();
    }
  }

  trackActivity(type: UserActivity['type'], details: Partial<UserActivity>): void {
    const activity: UserActivity = {
      timestamp: Date.now(),
      type,
      ...details,
    };

    this.userActivities.push(activity);
    this.lastActivityTime = activity.timestamp;

    if (this.userActivities.length > 100) {
      this.userActivities.shift();
    }
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  getPageViewDurations(): { [page: string]: number } {

    if (this.currentPage) {
      this.pageViewDurations[this.currentPage] = (this.pageViewDurations[this.currentPage] || 0) + (Date.now() - this.lastActivityTime);
      this.lastActivityTime = Date.now();
    }

    return this.pageViewDurations;
  }

  getActivities(): UserActivity[] {
    return this.userActivities;
  }

  getActivitySummary(): unknown {
    const clickCount = this.userActivities.filter(a => a.type === 'click').length;
    const pageViewCount = this.userActivities.filter(a => a.type === 'pageview').length;
    const inputCount = this.userActivities.filter(a => a.type === 'input').length;

    return {
      sessionDuration: this.getSessionDuration(),
      pageViews: pageViewCount,
      clicks: clickCount,
      inputs: inputCount,
      pageViewDurations: this.getPageViewDurations(),
    };
  }

  private startTrackingNavigation(): void {

  }
}
