import { Component, OnInit } from '@angular/core';
import { LoggerService } from '../../../common/services/logger.service';
import { ApiService } from '../../../common/services/api.service';

// Define the service interface
export interface ServiceInfo {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  description: string;
  lastActivity: Date | null;
  responseTime: number;
  type: string;
  endpoints: number;
  memoryUsage: number;
}

@Component({
  selector: 'app-services-dashboard',
  templateUrl: './services-dashboard.component.html',
  styleUrls: ['./services-dashboard.component.scss'],
  standalone: false
})
export class ServicesDashboardComponent implements OnInit {
  // Service data
  services: ServiceInfo[] = [];
  coreServices: ServiceInfo[] = [];
  featureServices: ServiceInfo[] = [];
  thirdPartyServices: ServiceInfo[] = [];
  
  // Computed properties to use in the template
  get activeServicesCount(): number {
    return this.services.filter(s => s.status === 'active').length;
  }
  
  get errorServicesCount(): number {
    return this.services.filter(s => s.status === 'error').length;
  }
  
  get inactiveServicesCount(): number {
    return this.services.filter(s => s.status === 'inactive').length;
  }
  
  displayedColumns: string[] = ['name', 'status', 'lastActivity', 'responseTime', 'endpoints', 'memoryUsage'];

  constructor(
    private loggerService: LoggerService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    // Simulate loading from API
    this.services = [
      {
        id: '1',
        name: 'Authentication Service',
        status: 'active',
        description: 'Manages user authentication',
        lastActivity: new Date(),
        responseTime: 120,
        type: 'core',
        endpoints: 6,
        memoryUsage: 42
      }
      // Add more sample services here
    ];
    
    // Split services by type
    this.coreServices = this.services.filter(s => s.type === 'core');
    this.featureServices = this.services.filter(s => s.type === 'feature');
    this.thirdPartyServices = this.services.filter(s => s.type === 'third-party');
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'active': return 'status-active';
      case 'error': return 'status-error';
      case 'inactive': return 'status-inactive';
      default: return '';
    }
  }

  formatLastActivity(date: Date | null): string {
    if (!date) return 'Never';
    return date.toLocaleString();
  }
}
