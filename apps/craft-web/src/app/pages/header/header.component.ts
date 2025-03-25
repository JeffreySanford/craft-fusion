import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../common/services/authentication.service';
import { Observable } from 'rxjs';
import { LoggerService } from '../../common/services/logger.service'; // Import LoggerService
import { ThemeService } from '../../common/services/theme.service'; // Import ThemeService

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent implements OnInit {
  title = 'frontend';
  isExpanded = false;
  isSmallScreen = false;
  isCollapsed = false;
  menuItems = [
    { label: 'Home', icon: 'home', routerLink: '/home', active: false },
    // Add more menu items as needed
  ];
  polling = true;

  userMenuItems: any[] = []; // Initialize as empty array
  isLoggedIn$: Observable<boolean>;
  isDarkTheme = false; // Add theme tracking property

  constructor(
    public authService: AuthenticationService,
    private logger: LoggerService, // Add LoggerService
    private themeService: ThemeService // Add ThemeService for theme toggle
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  ngOnInit(): void {
    this.logger.info('Header component initialized');
    
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.updateUserMenuItems();
      this.logger.debug('Auth state changed', { isLoggedIn });
    });
    
    // Track theme changes
    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
      this.logger.debug('Theme changed in header', { isDarkTheme: isDark });
    });
    
    this.updateUserMenuItems(); // Initial call to set menu items
  }

  updateUserMenuItems() {
    this.userMenuItems = [
      { label: 'Profile', icon: 'person', action: 'profile' },
      { label: 'Settings', icon: 'settings', action: 'settings' },
      { label: 'Theme', icon: 'palette', action: 'theme' },
      { label: 'Reports', icon: 'bar_chart', action: 'reports' }
    ];

    if (this.authService.getAuthToken()) {
      this.userMenuItems.push({ label: 'Logout', icon: 'logout', action: 'logout' });
      this.logger.debug('Added logout option to user menu');
    } else {
      this.userMenuItems.push({ label: 'Login', icon: 'login', action: 'login' });
      this.logger.debug('Added login option to user menu');
    }
  }

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    item.active = true;
    this.logger.debug('Menu item activated', { label: item.label });
  }

  handleUserMenuAction(action: string) {
    this.logger.info('User menu action selected', { action });
    
    if (action === 'login') {
      this.authService.login('test', 'test').subscribe(() => {
        this.updateUserMenuItems();
        this.logger.info('User logged in');
      });
    } else if (action === 'logout') {
      this.authService.logout();
      this.updateUserMenuItems();
      this.logger.info('User logged out');
    } else if (action === 'theme') {
      this.toggleTheme();
    }
    // Handle other actions as needed
  }
  
  // Add theme toggle method
  toggleTheme() {
    this.themeService.toggleTheme();
    this.logger.info('Theme toggled', { isDarkTheme: !this.isDarkTheme });
  }
}
