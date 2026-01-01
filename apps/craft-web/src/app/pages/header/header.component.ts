import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../common/services/auth/authentication.service';
import { LoggerService } from '../../common/services/logger.service';
import { ThemeService, ThemeName } from '../../common/services/theme.service';

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
  ];
  polling = true;

  userMenuItems: { label: string; icon: string; action: string; active?: boolean }[] = [];
  isLoggedIn$: Observable<boolean>;
  isAdmin$: Observable<boolean>;
  isDarkTheme = false;

  themeOptions: { name: ThemeName; label: string }[] = [
    { name: 'vibrant', label: 'Vibrant' },
    { name: 'light', label: 'Light' },
    { name: 'dark', label: 'Dark' },
  ];

  constructor(
    private authService: AuthenticationService,
    private logger: LoggerService,
    private themeService: ThemeService,
    private router: Router,
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.isAdmin$ = this.authService.isAdmin$;
  }

  ngOnInit(): void {
    this.logger.info('Header component initialized');

    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.updateUserMenuItems();
      this.logger.debug('Auth state changed', { isLoggedIn });
    });

    this.themeService.theme$.subscribe(theme => {
      this.isDarkTheme = theme === 'dark';
      this.logger.debug('Theme changed in header', { theme });
    });

    this.updateUserMenuItems();
  }

  updateUserMenuItems() {
    this.userMenuItems = [
      { label: 'Profile', icon: 'person', action: 'profile' },
      { label: 'Settings', icon: 'settings', action: 'settings' },
      { label: 'Theme', icon: 'palette', action: 'theme' },
      { label: 'Reports', icon: 'bar_chart', action: 'reports' },
    ];

    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        const loginIndex = this.userMenuItems.findIndex(item => item.action === 'login');
        if (loginIndex !== -1) this.userMenuItems.splice(loginIndex, 1);
        if (!this.userMenuItems.some(item => item.action === 'logout')) {
          this.userMenuItems.push({ label: 'Logout', icon: 'logout', action: 'logout' });
          this.logger.debug('Added logout option to user menu');
        }
      } else {
        const logoutIndex = this.userMenuItems.findIndex(item => item.action === 'logout');
        if (logoutIndex !== -1) this.userMenuItems.splice(logoutIndex, 1);
        if (!this.userMenuItems.some(item => item.action === 'login')) {
          this.userMenuItems.push({ label: 'Login', icon: 'login', action: 'login' });
          this.logger.debug('Added login option to user menu');
        }
      }
    });
  }

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    if (item) {
      item.active = true;
      this.logger.debug('Menu item activated', { label: item.label });
    }
  }

  handleUserMenuAction(action: string) {
    this.logger.info('User menu action selected', { action });

    if (action === 'login') {
      this.logger.info('Logging in with test credentials');
      this.authService.login('test', 'test').subscribe({
        next: response => {
          this.logger.info('Login successful', { username: response.user.username });
          this.updateUserMenuItems();
        },
        error: error => {
          this.logger.error('Login failed', error);
        },
      });
    } else if (action === 'logout') {
      this.authService.logout();
      this.updateUserMenuItems();
      this.logger.info('User logged out');
    } else if (action === 'theme') {
      this.toggleTheme();
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  setThemeByName(name: ThemeName) {
    this.themeService.setThemeByName(name);
  }
}
