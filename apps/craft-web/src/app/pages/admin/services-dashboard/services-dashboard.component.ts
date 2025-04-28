import { Component, OnInit, OnDestroy } from '@angular/core';
import { ServiceRegistryService, ServiceInfo } from '../../../common/services/service-registry.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-services-dashboard',
  templateUrl: './services-dashboard.component.html',
  styleUrls: ['./services-dashboard.component.scss']
})
export class ServicesDashboardComponent implements OnInit, OnDestroy {
  services: ServiceInfo[] = [];
  coreServices: ServiceInfo[] = [];
  featureServices: ServiceInfo[] = [];
  thirdPartyServices: ServiceInfo[] = [];
  
  displayedColumns: string[] = [
    'name', 'status', 'type', 'lastActivity', 
    'usageCount', 'errorCount', 'successRate', 'avgResponseTime'
  ];
  
  private subscription: Subscription = new Subscription();
  
  constructor(private serviceRegistry: ServiceRegistryService) { }

  ngOnInit(): void {
    // Refresh services data every 5 seconds
    this.subscription.add(
      interval(5000)
        .pipe(
          startWith(0),
          switchMap(() => this.serviceRegistry.services$)
        )
        .subscribe(services => {
          this.services = services;
          this.coreServices = services.filter(s => s.category === 'core');
          this.featureServices = services.filter(s => s.category === 'feature');
          this.thirdPartyServices = services.filter(s => s.category === 'third-party');
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'error': return 'status-error';
      default: return '';
    }
  }

  formatLastActivity(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ago`;
    } else {
      return `${Math.floor(seconds / 86400)}d ago`;
    }
  }
}
