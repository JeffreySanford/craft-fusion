import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserEventService } from '../../common/services/user-event.service';
import { LoggerService } from '../../common/services/logger.service';
import { MenuItem } from './sidebar.types';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  menuItems: MenuItem[] = [];
  isAdmin = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private userEventService: UserEventService,
    private logger: LoggerService
  ) {
    this.logger.registerService('SidebarComponent');
  }

  ngOnInit(): void {
    this.initializeMenu();
    
    // Subscribe to user state changes
    this.userEventService.getUserStateChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.logger.info('User state change detected in sidebar', { 
            username: user.username,
            isAdmin: user.isAdmin 
          });
          
          this.isAdmin = user.isAdmin;
          
          // Update menu items if user is admin
          if (this.isAdmin) {
            this.addAdminMenuItems();
          } else {
            this.removeAdminMenuItems();
          }
        } else {
          this.logger.info('User logged out detected in sidebar');
          this.isAdmin = false;
          this.removeAdminMenuItems();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.logger.debug('Sidebar toggled', { collapsed: this.isCollapsed });
  }

  // The navigateTo method required by the template
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.logger.debug('Navigating to route', { route });
  }
  
  private initializeMenu(): void {
    // Base menu items that all users can see
    this.menuItems = [
      { 
        icon: 'home', 
        label: 'Home',
        route: '/home',
        routerLink: '/home', // Keep both for backward compatibility
        active: true
      },
      { 
        icon: 'table_chart', 
        label: 'Table',
        route: '/table',
        routerLink: '/table', // Keep both for backward compatibility
        active: false
      },
      { 
        icon: 'bar_chart', 
        label: 'Data Visualizations',
        route: '/data-visualizations',
        routerLink: '/data-visualizations', // Keep both for backward compatibility
        active: false
      },
      { 
        icon: 'restaurant', 
        label: 'Peasant Kitchen',
        route: '/peasant-kitchen',
        routerLink: '/peasant-kitchen', // Keep both for backward compatibility
        active: false
      },
      { 
        icon: 'movie', 
        label: 'HTML Video',
        route: '/space-video',
        routerLink: '/space-video', // Keep both for backward compatibility
        active: false
      },
      { 
        icon: 'chat', 
        label: 'Chat',
        route: '/chat',
        routerLink: '/chat', // Keep both for backward compatibility
        active: false
      },
      { 
        icon: 'book', 
        label: 'Book',
        route: '/book',
        routerLink: '/book', // Keep both for backward compatibility
        active: false
      },
    ];
    
    // Check if user is already admin on init
    if (this.userEventService.isUserAdmin()) {
      this.isAdmin = true;
      this.addAdminMenuItems();
    }
  }
  
  private addAdminMenuItems(): void {
    // Check if admin items already exist
    const adminExists = this.menuItems.some(item => item.label === 'Admin');
    
    if (!adminExists) {
      this.logger.debug('Adding admin menu items');
      
      // Add admin menu items with correct typing including routerLink
      this.menuItems.push({
        icon: 'admin_panel_settings',
        label: 'Admin',
        route: '/admin',
        routerLink: '/admin',
        isAdminFeature: true,
        active: false
      });
      
      // Add additional admin items if needed
      this.menuItems.push({
        icon: 'settings_applications',
        label: 'System Settings',
        route: '/admin/settings',
        routerLink: '/admin/settings',
        isAdminFeature: true,
        active: false
      });
      
      this.menuItems.push({
        icon: 'people_alt',
        label: 'User Management',
        route: '/admin/users',
        routerLink: '/admin/users',
        isAdminFeature: true,
        active: false
      });
    }
  }
  
  private removeAdminMenuItems(): void {
    this.logger.debug('Removing admin menu items');
    
    // Filter out admin menu items
    this.menuItems = this.menuItems.filter(item => !item.isAdminFeature);
  }
}