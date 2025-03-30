import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from '../../common/services/theme.service';
import { LoggerService } from '../../common/services/logger.service';
import { HealthService } from '../../common/services/health.service';
import { AuthenticationService } from '../../common/services/authentication.service';
import { NotificationService } from '../../common/services/notification.service';
import { UserFacadeService } from '../../common/facades/user-facade.service';
import { UserState } from '../../common/interfaces/user-state.interface';
import { MatDialog } from '@angular/material/dialog';
import { trigger, state, style, animate, transition, query, stagger } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('logoAnimation', [
      state('normal', style({ transform: 'scale(1)' })),
      state('hovered', style({ transform: 'scale(1.1)' })),
      transition('normal <=> hovered', animate('0.2s ease-in-out'))
    ]),
    trigger('navItemsAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-10px)' }),
          stagger(80, [
            animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('themeTransition', [
      transition('* => *', [
        style({ opacity: 0.8 }),
        animate('0.5s ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('ripple', [
      transition('* => active', [
        animate('0.6s ease-out', style({ transform: 'scale(2)', opacity: 0 }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Theme properties
  themeClass = '';
  isDarkTheme = false;

  // User properties
  user: any = null;
  userAvatar = '/assets/images/default-avatar.png'; // Default avatar path
  isAuthenticated = false;
  isLoggedIn = false;

  // Notifications
  notificationCount = 0;

  // System health
  systemHealth: 'online' | 'degraded' | 'offline' = 'online';

  // Navigation options
  navItems = [
    { icon: 'home', label: 'Home', route: '/home' },
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'chat', label: 'Chat', route: '/chat' },
    { icon: 'admin_panel_settings', label: 'Admin', route: '/admin', requiresAdmin: true },
    { path: '/projects', label: 'Projects', icon: 'work' },
    { path: '/reports', label: 'Reports', icon: 'assessment' }
  ];

  // Animation state variables
  logoState = 'normal';
  rippleState = 'inactive';
  navItemsState: any = {};

  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private logger: LoggerService,
    private router: Router,
    private authService: AuthenticationService,
    private notificationService: NotificationService,
    private healthService: HealthService,
    private userFacade: UserFacadeService,
    private dialog: MatDialog
  ) {
    this.logger.registerService('HeaderComponent');
  }

  ngOnInit(): void {
    // Subscribe to theme updates
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkTheme = isDark;
        this.themeClass = isDark ? 'dark-theme' : 'light-theme';
        this.logger.debug('Theme updated', { isDarkTheme: isDark });
      });

    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        // When theme changes, trigger animation
        this.themeClass = theme;

        // Trigger ripple animation
        this.triggerRippleAnimation();
      });

    // Check initial login state
    this.isLoggedIn = this.authService.isLoggedIn();

    // Set up periodic check for login status changes
    interval(10000) // Check every 10 seconds
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const currentStatus = this.authService.isLoggedIn();
        if (this.isLoggedIn !== currentStatus) {
          this.isLoggedIn = currentStatus;
        }
      });

    // Subscribe to user authentication state
    this.userFacade.getUserState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.user = user;
        if (user && user.preferences && user.preferences.avatar) {
          this.userAvatar = user.preferences.avatar;
        } else {
          this.userAvatar = '/assets/images/default-avatar.png';
        }

        // Get notification count if logged in
        if (this.isLoggedIn) {
          this.notificationService.getUnreadCount()
            .pipe(takeUntil(this.destroy$))
            .subscribe(count => {
              this.notificationCount = count;
            });
        } else {
          this.notificationCount = 0;
        }
      });

    // Mock notification count for now
    this.notificationCount = 5;

    // Subscribe to health status
    this.healthService.getHealthStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.systemHealth = status.status;
        if (status.status !== 'online') {
          this.logger.warn(`System health degraded: ${status.status}`, {
            memory: status.memory?.usage,
            services: status.services
          });
        }
      });

    // Initialize each nav item animation state
    this.navItems.forEach((item, index) => {
      this.navItemsState[index] = 'ready';
    });

    this.logger.info('Header component initialized');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.logger.debug('Header component destroyed');
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.logger.debug('Theme toggled by user');
  }

  /**
   * Log in the user
   */
  login(): void {
    this.logger.info('User attempting to login');
    
    // For demo purposes, simulate a login with admin rights
    // In a real app, this would route to a login page or show a login modal
    this.authService.login({username: 'admin', password: 'admin123'}).subscribe({
      next: (response) => {
        this.logger.info('User logged in successfully', { userId: response?.id });
        this.notificationService.showSuccess('Logged in successfully as Admin');
        this.isLoggedIn = true;
        // The auth service should emit an event that UserEventService will pick up
      },
      error: (error) => {
        this.logger.error('Login failed', { error });
        this.notificationService.showError('Login failed, please try again');
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Log out the current user
   */
  logout(): void {
    this.logger.info('User logging out');
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/home']);
        this.notificationService.showSuccess('Successfully logged out');
        this.isLoggedIn = false; // Update local state immediately
      },
      error: (error) => {
        this.logger.error('Logout failed', { error });
        this.notificationService.showError('Failed to log out, please try again');
      }
    });
  }

  /**
   * Navigate to user profile
   */
  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navigate to settings page
   */
  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Navigate to notifications page
   */
  viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  /**
   * Open help dialog
   */
  openHelpDialog(): void {
    this.notificationService.showInfo('Help documentation is coming soon!');
  }

  /**
   * Get health status class for styling
   */
  getHealthStatusClass(): string {
    switch (this.systemHealth) {
      case 'online': return 'status-online';
      case 'degraded': return 'status-degraded';
      case 'offline': return 'status-offline';
      default: return '';
    }
  }

  /**
   * Animation methods
   */
  toggleLogoState(): void {
    this.logoState = this.logoState === 'normal' ? 'hovered' : 'normal';
  }

  triggerRippleAnimation(): void {
    this.rippleState = 'active';
    setTimeout(() => {
      this.rippleState = 'inactive';
    }, 700);
  }

  animateNavItem(index: number): void {
    this.navItemsState[index] = 'active';
    setTimeout(() => {
      this.navItemsState[index] = 'ready';
    }, 300);
  }
}
