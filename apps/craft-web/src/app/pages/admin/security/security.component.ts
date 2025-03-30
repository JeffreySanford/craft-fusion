import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from '../../../common/services/theme.service';
import { LoggerService } from '../../../common/services/logger.service';
import { UserActivityService } from '../../../common/services/user-activity.service';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'warning' | 'error' | 'info' | 'success';
  source: string;
  message: string;
  details?: any;
}

interface SecurityScore {
  value: number;
  label: string;
  color: string;
}

interface LoginEvent {
  username: string;
  timestamp: Date;
  ipAddress: string;
  success: boolean;
  location?: string;
}

interface FirewallStats {
  blockedRequests: number;
  allowedRequests: number;
  lastUpdated: Date;
}

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
  standalone: false
})
export class SecurityComponent implements OnInit, OnDestroy {
  themeClass = '';
  private destroy$ = new Subject<void>();
  
  securityEvents: SecurityEvent[] = [];
  securityScore: SecurityScore = {
    value: 0,
    label: 'Calculating...',
    color: '#36A2EB'
  };
  
  securityStats = {
    totalWarnings: 0,
    totalErrors: 0,
    recentEvents: 0,
    authAttempts: 0
  };
  
  // Recent Logins
  recentLogins: LoginEvent[] = [];
  
  // Firewall Status
  firewallActive: boolean = true;
  firewallStats: FirewallStats = {
    blockedRequests: 0,
    allowedRequests: 0,
    lastUpdated: new Date()
  };
  
  constructor(
    private themeService: ThemeService, 
    private logger: LoggerService,
    private userActivityService: UserActivityService
  ) {}
  
  ngOnInit(): void {
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });
    
    // Initialize security events
    this.loadSecurityEvents();
    
    // Calculate security score
    this.calculateSecurityScore();
    
    // Subscribe to logs for security events
    this.logger.logs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        const securityLogs = logs.filter(log => 
          log.category?.includes('security') || 
          log.message?.toLowerCase().includes('security')
        );
        
        // Update security events based on logs
        if (securityLogs.length > 0) {
          this.updateSecurityEvents(securityLogs);
        }
      });
    
    // Set up periodic updates
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSecurityEvents();
        this.calculateSecurityScore();
      });
    
    // Generate periodic security events for demo purposes
    interval(45000) // Every 45 seconds
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.generateRandomSecurityEvent();
      });

    // Initial event generation
    this.generateRandomSecurityEvent();
    
    console.log('Security component initialized with', this.securityEvents.length, 'events');

    // Log component initialization
    this.logger.info('Security monitoring initialized', {
      component: 'SecurityComponent',
      category: 'security:monitoring'
    });
    
    // Also initialize the firewall statistics and recent logins
    this.loadRecentLogins();
    this.loadFirewallStats();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadSecurityEvents(): void {
    // Get security events from logs
    const securityLogs = this.logger.getLogsByCategory('security');
    const authLogs = this.logger.getLogsByTag('authentication');
    
    // If we have security logs, use them
    if (securityLogs.length > 0 || authLogs.length > 0) {
      this.updateSecurityEvents([...securityLogs, ...authLogs]);
    } else {
      // Otherwise generate mock security events
      this.generateMockSecurityEvents();
    }
  }
  
  private updateSecurityEvents(logs: any[]): void {
    // Convert logs to security events
    const newEvents: SecurityEvent[] = logs.map(log => ({
      id: log.id || `security-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: log.timestamp || new Date(),
      type: this.getEventTypeFromLog(log),
      source: log.source || log.component || 'System',
      message: log.message || 'Security event detected',
      details: log.details || log.content
    }));
    
    // Update security events (only keep unique events)
    this.securityEvents = [
      ...newEvents,
      ...this.securityEvents.filter(existing => 
        !newEvents.some(newEvent => newEvent.id === existing.id)
      )
    ].slice(0, 50); // Limit to 50 events
    
    // Sort by timestamp (newest first)
    this.securityEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Update security stats
    this.updateSecurityStats();
  }
  
  private getEventTypeFromLog(log: any): 'warning' | 'error' | 'info' | 'success' {
    if (log.level === 0) return 'error';
    if (log.level === 1) return 'warning';
    if (log.level === 2) return 'info';
    
    // Check content for keywords
    const content = (log.message || '') + (log.content || '');
    
    if (content.toLowerCase().includes('error') || 
        content.toLowerCase().includes('fail')) {
      return 'error';
    }
    
    if (content.toLowerCase().includes('warn') || 
        content.toLowerCase().includes('suspicious')) {
      return 'warning';
    }
    
    if (content.toLowerCase().includes('success') || 
        content.toLowerCase().includes('authenticated')) {
      return 'success';
    }
    
    return 'info';
  }
  
  private generateMockSecurityEvents(): void {
    const eventTypes: ('warning' | 'error' | 'info' | 'success')[] = ['warning', 'error', 'info', 'success'];
    const sources = ['Authentication', 'Firewall', 'Access Control', 'User Activity', 'API', 'Database'];
    const messages = [
      'Failed login attempt',
      'Suspicious IP address detected',
      'Session timeout',
      'Password changed',
      'New device login',
      'Access permission granted',
      'Access permission denied',
      'Data export initiated',
      'Configuration changed',
      'Security scan completed'
    ];
    
    // Generate 8-12 random events
    const eventCount = Math.floor(Math.random() * 5) + 8;
    const newEvents: SecurityEvent[] = [];
    
    for (let i = 0; i < eventCount; i++) {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Create event with random timestamp in last 24 hours
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - Math.random() * 24);
      
      newEvents.push({
        id: `mock-security-${Date.now()}-${i}`,
        timestamp,
        type,
        source,
        message,
        details: {
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userId: Math.random() > 0.3 ? `user-${Math.floor(Math.random() * 1000)}` : null,
          location: Math.random() > 0.5 ? 'Internal network' : 'External access'
        }
      });
    }
    
    this.securityEvents = newEvents;
    this.updateSecurityStats();
  }
  
  private generateRandomSecurityEvent(): void {
    const eventTypes: ('warning' | 'error' | 'info' | 'success')[] = ['info', 'info', 'info', 'warning', 'warning', 'error', 'success'];
    const sources = ['Authentication', 'Firewall', 'Access Control', 'User Activity', 'API', 'Database'];
    const messages = [
      'Failed login attempt',
      'Suspicious IP address detected',
      'Session timeout',
      'Password changed',
      'New device login',
      'Access permission granted',
      'Access permission denied',
      'Data export initiated',
      'Configuration changed',
      'Security scan completed'
    ];
    
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    const newEvent: SecurityEvent = {
      id: `security-${Date.now()}`,
      timestamp: new Date(),
      type,
      source,
      message,
      details: {
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userId: Math.random() > 0.3 ? `user-${Math.floor(Math.random() * 1000)}` : null,
        location: Math.random() > 0.5 ? 'Internal network' : 'External access'
      }
    };
    
    // Create a log entry for this security event
    switch (type) {
      case 'error':
        this.logger.error(`${source}: ${message}`, { 
          category: 'security',
          source,
          ...newEvent.details
        });
        break;
      case 'warning':
        this.logger.warn(`${source}: ${message}`, {
          category: 'security',
          source,
          ...newEvent.details
        });
        break;
      case 'success':
        this.logger.info(`${source}: ${message}`, {
          category: 'security',
          type: 'success',
          source,
          ...newEvent.details
        });
        break;
      default:
        this.logger.info(`${source}: ${message}`, {
          category: 'security',
          source,
          ...newEvent.details
        });
    }
    
    // Update UI directly for immediate feedback
    this.securityEvents = [
      newEvent,
      ...this.securityEvents
    ].slice(0, 50); // Limit to 50 events
    
    this.updateSecurityStats();
  }
  
  private updateSecurityStats(): void {
    this.securityStats.totalWarnings = this.securityEvents.filter(e => e.type === 'warning').length;
    this.securityStats.totalErrors = this.securityEvents.filter(e => e.type === 'error').length;
    
    // Count events in the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    this.securityStats.recentEvents = this.securityEvents.filter(
      e => e.timestamp > oneHourAgo
    ).length;
    
    // Count auth attempts
    this.securityStats.authAttempts = this.securityEvents.filter(
      e => e.source.toLowerCase().includes('auth') || 
           e.message.toLowerCase().includes('login') ||
           e.message.toLowerCase().includes('password')
    ).length;
  }
  
  private calculateSecurityScore(): void {
    // Base score starts at 100
    let score = 100;
    
    // Deduct points for warnings and errors
    score -= this.securityStats.totalWarnings * 2;
    score -= this.securityStats.totalErrors * 5;
    
    // Deduct points for recent events (more concerning)
    score -= this.securityStats.recentEvents * 3;
    
    // Big penalty for inactive firewall
    if (!this.firewallActive) {
      score -= 30;
    }
    
    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Set score label and color
    let label = 'Critical';
    let color = '#FF6384'; // Red
    
    if (score >= 90) {
      label = 'Excellent';
      color = '#4BC0C0'; // Green
    } else if (score >= 70) {
      label = 'Good';
      color = '#36A2EB'; // Blue
    } else if (score >= 50) {
      label = 'Fair';
      color = '#FFCE56'; // Yellow
    } else if (score >= 30) {
      label = 'Poor';
      color = '#FF9F40'; // Orange
    }
    
    this.securityScore = { value: score, label, color };
  }
  
  private loadRecentLogins(): void {
    // In a real app, this would come from an authentication service
    // For now, we'll generate mock data
    this.recentLogins = [];
    
    // Generate 5 random logins
    const users = ['admin', 'user1', 'jsmith', 'mjohnson', 'alee', 'dthompson'];
    for (let i = 0; i < 5; i++) {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 60 * 24)); // Random time in last 24 hours
      
      this.recentLogins.push({
        username: users[Math.floor(Math.random() * users.length)],
        timestamp: timestamp,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        success: Math.random() > 0.3 // 70% success rate
      });
    }
    
    // Sort by timestamp (newest first)
    this.recentLogins.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  private loadFirewallStats(): void {
    // In a real app, this would come from a security service
    // Generate realistic mock data for now
    this.firewallStats = {
      blockedRequests: Math.floor(Math.random() * 1000) + 100,
      allowedRequests: Math.floor(Math.random() * 10000) + 1000,
      lastUpdated: new Date()
    };
  }
  
  private updateFirewallStats(): void {
    // Update with incremental changes to simulate real activity
    this.firewallStats.blockedRequests += Math.floor(Math.random() * 5);
    this.firewallStats.allowedRequests += Math.floor(Math.random() * 20);
    this.firewallStats.lastUpdated = new Date();
  }
  
  toggleFirewall(): void {
    this.firewallActive = !this.firewallActive;
    
    // Log the action
    if (this.firewallActive) {
      this.logger.info('Firewall activated', { 
        category: 'security:firewall',
        action: 'activate'
      });
    } else {
      this.logger.warn('Firewall deactivated', { 
        category: 'security:firewall',
        action: 'deactivate' 
      });
    }
    
    // Recalculate security score
    this.calculateSecurityScore();
  }
  
  getEventIcon(type: string): string {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }
  
  getEventClass(type: string): string {
    return `event-${type}`;
  }
  
  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} sec ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  refreshSecurityData(): void {
    this.loadSecurityEvents();
    this.loadRecentLogins();
    this.loadFirewallStats();
    this.calculateSecurityScore();
    
    this.logger.info('Security data refreshed manually', {
      component: 'SecurityComponent',
      category: 'security:monitoring'
    });
  }
}
