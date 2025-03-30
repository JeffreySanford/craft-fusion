import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ThemeService } from '../../common/services/theme.service';
import { FooterStateService } from '../../common/services/footer-state.service';
import { HealthService, HealthStatus } from '../../common/services/health.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false
})
export class FooterComponent implements OnInit, OnDestroy {
  themeClass: string = '';
  expanded = false;
  year = new Date().getFullYear();
  
  // Health status properties
  healthStatus: HealthStatus | null = null;
  showHealthTooltip = false;
  
  // Performance metrics
  performanceMetrics = {
    cpuLoad: '45%',
    memoryUsage: '62%',
    networkLatency: '85ms'
  };
  
  // Chart configuration
  chartBorderColor = '#4285F4';
  isSimulatingData = true;
  serviceMetrics: any[] = [];
  serviceIconMap: {[key: string]: string} = {
    'users': 'person',
    'products': 'shopping_bag',
    'orders': 'receipt',
    'auth': 'security',
    'default': 'api'
  };
  
  // Logo links
  logoLinks = [
    { src: 'assets/images/logos/angular.png', alt: 'Angular', class: 'dev-logo' },
    { src: 'assets/images/logos/typescript.png', alt: 'TypeScript', class: 'dev-logo' },
    { src: 'assets/images/logos/nestjs.png', alt: 'NestJS', class: 'dev-logo' },
    { src: 'assets/images/logos/agency1.png', alt: 'Agency 1', class: 'agency-logo' },
    { src: 'assets/images/logos/agency2.png', alt: 'Agency 2', class: 'agency-logo' },
    { src: 'assets/images/logos/agency3.png', alt: 'Agency 3', class: 'agency-logo' }
  ];
  
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private footerStateService: FooterStateService,
    private healthService: HealthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });

    // Subscribe to footer expanded state
    this.footerStateService.expanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(expanded => {
        this.expanded = expanded;
      });
      
    // Subscribe to health status
    this.healthService.getHealthStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.healthStatus = status;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFooter(): void {
    this.footerStateService.setExpanded(!this.expanded);
  }
  
  /**
   * Handle panel toggle events
   */
  onPanelToggled(isOpen: boolean): void {
    this.footerStateService.setExpanded(isOpen);
  }
  
  /**
   * Get the CSS class for the health status indicator
   */
  getHealthStatusClass(): string {
    if (!this.healthStatus) {
      return 'status-offline';
    }
    
    return `status-${this.healthStatus.status}`;
  }
  
  /**
   * Get the CSS class for a service status
   */
  getServiceStatusClass(status?: string): string {
    if (!status) {
      return 'status-down';
    }
    
    return `status-${status}`;
  }
  
  /**
   * Format uptime to human-readable string
   */
  formatUptime(uptime?: number): string {
    if (!uptime) {
      return 'Unknown';
    }
    
    return this.healthService.formatUptime(uptime);
  }
  
  /**
   * Get CPU load status class
   */
  getCpuLoadClass(): string {
    const load = parseInt(this.performanceMetrics.cpuLoad);
    if (load < 50) return 'status-good';
    if (load < 80) return 'status-warning';
    return 'status-critical';
  }
  
  /**
   * Get memory usage status class
   */
  getMemoryUsageClass(): string {
    const usage = parseInt(this.performanceMetrics.memoryUsage);
    if (usage < 60) return 'status-good';
    if (usage < 85) return 'status-warning';
    return 'status-critical';
  }
  
  /**
   * Get network latency status class
   */
  getNetworkLatencyClass(): string {
    const latency = parseInt(this.performanceMetrics.networkLatency);
    if (latency < 100) return 'status-good';
    if (latency < 200) return 'status-warning';
    return 'status-critical';
  }
  
  /**
   * Toggle data simulation
   */
  toggleDataSimulation(): void {
    this.isSimulatingData = !this.isSimulatingData;
  }
  
  /**
   * Navigate to email client
   */
  sendEmail(): void {
    window.location.href = 'mailto:contact@example.com';
  }
  
  /**
   * Open GitHub profile
   */
  openGitHub(): void {
    window.open('https://github.com/example', '_blank');
  }
  
  /**
   * Navigate to resume page
   */
  navigateToResume(): void {
    this.router.navigate(['/resume']);
  }
}