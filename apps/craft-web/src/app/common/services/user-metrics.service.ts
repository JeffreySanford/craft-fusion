import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, of } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { UserTrackingService, UserActivity } from './user-tracking.service';
import { ApiService } from './api.service';

export interface UserMetrics {
  sessionCount: number;
  avgSessionDuration: number;
  totalPageViews: number;
  totalInteractions: number;
  conversionRate?: number;
  engagementScore: number;
  mostVisitedPages: Array<{ path: string, count: number }>;
  deviceBreakdown: Record<string, number>;
  interactionsByHour: number[];
  lastUpdated: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserMetricsService {
  private metrics$ = new BehaviorSubject<UserMetrics>({
    sessionCount: 0,
    avgSessionDuration: 0,
    totalPageViews: 0,
    totalInteractions: 0,
    engagementScore: 0,
    mostVisitedPages: [],
    deviceBreakdown: {},
    interactionsByHour: Array(24).fill(0),
    lastUpdated: Date.now()
  });

  constructor(
    private logger: LoggerService,
    private userTrackingService: UserTrackingService,
    private apiService: ApiService
  ) {
    this.logger.registerService('UserMetricsService');
    this.logger.info('UserMetricsService initialized');

    // Calculate metrics initially and then periodically
    this.calculateMetrics();
    this.setupPeriodicMetricsCalculation();
  }

  /**
   * Get current user metrics
   */
  fetchMetrics(): Observable<UserMetrics> {
    this.logger.debug('Fetching user metrics');
    return this.metrics$.asObservable();
  }

  /**
   * Immediately calculate and update metrics
   */
  refreshMetrics(): void {
    this.logger.debug('Manually refreshing metrics');
    this.calculateMetrics();
  }

  /**
   * Submit metrics to backend for analytics
   */
  submitMetricsToBackend(): Observable<any> {
    const currentMetrics = this.metrics$.value;
    this.logger.info('Submitting metrics to backend', { metrics: currentMetrics });

    return this.apiService.post('user/metrics', currentMetrics)
      .pipe(
        map(response => {
          this.logger.debug('Metrics submitted successfully');
          return response;
        })
      );
  }

  /**
   * Calculate metrics based on user activity
   */
  private calculateMetrics(): void {
    const activities = this.userTrackingService.getActivities();
    const now = Date.now();

    // Skip calculation if no activities
    if (activities.length === 0) {
      this.logger.debug('No activities to calculate metrics from');
      return;
    }

    // Calculate pageviews
    const pageViews = activities.filter(a => a.type === 'pageView').length;

    // Calculate total interactions (clicks, form interactions)
    const interactions = activities.filter(a =>
      a.type === 'click' || a.type === 'formInteraction'
    ).length;

    // Calculate most visited pages
    const pageVisits = new Map<string, number>();
    activities.filter(a => a.type === 'pageView' && a.details?.path)
      .forEach(a => {
        const path = a.details?.path as string;
        pageVisits.set(path, (pageVisits.get(path) || 0) + 1);
      });

    const mostVisitedPages = Array.from(pageVisits.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate interactions by hour
    const interactionsByHour = Array(24).fill(0);
    activities.forEach(a => {
      const hour = new Date(a.timestamp).getHours();
      interactionsByHour[hour]++;
    });

    // Calculate engagement score (simplified version)
    // Based on recency, frequency and duration
    const engagementScore = this.calculateEngagementScore(activities, now);

    // Device breakdown (simplified)
    const deviceBreakdown = {
      'desktop': 80,
      'mobile': 15,
      'tablet': 5
    };

    // Session metrics (simplified)
    const sessionDuration = this.userTrackingService.getSessionDuration();

    // Update metrics
    this.metrics$.next({
      sessionCount: 1, // Simplified, would normally come from backend
      avgSessionDuration: sessionDuration,
      totalPageViews: pageViews,
      totalInteractions: interactions,
      engagementScore,
      mostVisitedPages,
      deviceBreakdown,
      interactionsByHour,
      lastUpdated: now
    });

    this.logger.debug('Metrics calculated', {
      pageViews,
      interactions,
      sessionDuration: Math.round(sessionDuration / 1000) + 's',
      engagementScore
    });
  }

  /**
   * Calculate engagement score based on user activities
   */
  private calculateEngagementScore(activities: UserActivity[], now: number): number {
    if (activities.length === 0) return 0;

    // Recency: How recent was the last interaction
    const mostRecent = Math.max(...activities.map(a => a.timestamp));
    const recencyScore = Math.max(0, 1 - (now - mostRecent) / (24 * 60 * 60 * 1000)); // Scale by day

    // Frequency: How many interactions per hour
    const oldestActivity = Math.min(...activities.map(a => a.timestamp));
    const hoursDiff = Math.max(1, (now - oldestActivity) / (60 * 60 * 1000));
    const frequencyScore = Math.min(1, activities.length / (hoursDiff * 5)); // 5 activities per hour is max

    // Depth: How many different pages visited
    const uniquePaths = new Set(
      activities
        .filter(a => a.type === 'pageView' && a.details?.path)
        .map(a => a.details?.path)
    ).size;
    const depthScore = Math.min(1, uniquePaths / 5); // 5 unique pages is max

    // Overall score (0-100)
    return Math.round((recencyScore * 0.4 + frequencyScore * 0.4 + depthScore * 0.2) * 100);
  }

  /**
   * Setup periodic metrics calculation
   */
  private setupPeriodicMetricsCalculation(): void {
    // Calculate metrics every 5 minutes
    timer(300000, 300000).subscribe(() => {
      this.logger.debug('Performing periodic metrics calculation');
      this.calculateMetrics();
    });
  }
}
