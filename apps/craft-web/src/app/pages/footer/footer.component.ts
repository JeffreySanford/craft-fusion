import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeService } from '../../common/services/theme.service';
import { LayoutService } from '../../common/services/layout.service';
import { PerformanceMetricsService } from '../../common/services/performance-metrics.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface PartnerLogo {
  name: string;
  imageUrl: string;
  siteUrl: string;
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false,
})
export class FooterComponent implements OnInit, OnDestroy {
  isExpanded = false;
  isFooterExpanded$: Observable<boolean>; // Observable for the footer expanded state
  currentTheme = 'patriotic-theme';
  performanceData: any[] = [];
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255,255,255,0.1)'
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 1
      },
      point: {
        radius: 2,
        hitRadius: 10,
        hoverRadius: 4
      }
    }
  };
  
  industryLogos: PartnerLogo[] = [
    { name: 'Tech Solutions', imageUrl: 'assets/images/logos/industry1.png', siteUrl: 'https://example.com/partner1' },
    { name: 'Secure Systems', imageUrl: 'assets/images/logos/industry2.png', siteUrl: 'https://example.com/partner2' },
    { name: 'Data Insights', imageUrl: 'assets/images/logos/industry3.png', siteUrl: 'https://example.com/partner3' },
    { name: 'Cloud Experts', imageUrl: 'assets/images/logos/industry4.png', siteUrl: 'https://example.com/partner4' },
    { name: 'Strategy Group', imageUrl: 'assets/images/logos/industry5.png', siteUrl: 'https://example.com/partner5' },
    { name: 'Future Tech', imageUrl: 'assets/images/logos/industry6.png', siteUrl: 'https://example.com/partner6' }
  ];
  
  federalLogos: PartnerLogo[] = [
    { name: 'Department of Defense', imageUrl: 'assets/images/logos/federal1.png', siteUrl: 'https://defense.gov' },
    { name: 'Department of Energy', imageUrl: 'assets/images/logos/federal2.png', siteUrl: 'https://energy.gov' },
    { name: 'NASA', imageUrl: 'assets/images/logos/federal3.png', siteUrl: 'https://nasa.gov' },
    { name: 'Department of State', imageUrl: 'assets/images/logos/federal4.png', siteUrl: 'https://state.gov' },
    { name: 'FEMA', imageUrl: 'assets/images/logos/federal5.png', siteUrl: 'https://fema.gov' },
    { name: 'GSA', imageUrl: 'assets/images/logos/federal6.png', siteUrl: 'https://gsa.gov' }
  ];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private themeService: ThemeService,
    private layoutService: LayoutService,
    private performanceService: PerformanceMetricsService
  ) {
    // Set the Observable directly from the service
    this.isFooterExpanded$ = this.layoutService.footerExpanded$;
  }
  
  ngOnInit(): void {
    console.log('Footer component initialized');
    
    // Subscribe to theme changes
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
      });
    
    // Subscribe to footer expanded state
    this.layoutService.footerExpanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(expanded => {
        console.log('Footer expansion state changed:', expanded);
        this.isExpanded = expanded;
      });
    
    // Get performance metrics data for the graph
    this.performanceService.getPerformanceData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.performanceData = data;
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  toggleExpand(): void {
    console.log('Toggle footer expand clicked, current state:', this.isExpanded);
    const newState = !this.isExpanded;
    this.layoutService.setFooterExpanded(newState);
  }
  
  navigateToPartnerSite(logo: PartnerLogo): void {
    if (logo && logo.siteUrl) {
      window.open(logo.siteUrl, '_blank', 'noopener,noreferrer');
    }
  }
}