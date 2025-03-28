import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import { AuthenticationService } from '../../common/services/authentication.service';
import { Observable } from 'rxjs';
import { LoggerService, LogLevel } from '../../common/services/logger.service'; // Import LoggerService
import { ThemeService } from '../../common/services/theme.service'; // Import ThemeService
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatRadioChange } from '@angular/material/radio';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
  animations: [
    trigger('expandCollapse', [
      state('expanded', style({
        height: '*',
        opacity: 1,
        transform: 'rotateX(0)'
      })),
      state('collapsed', style({
        height: '0',
        opacity: 0,
        transform: 'rotateX(-90deg)'
      })),
      transition('collapsed => expanded', [
        animate('300ms ease-out')
      ]),
      transition('expanded => collapsed', [
        animate('300ms ease-in')
      ])
    ])
  ]
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

  remainingMenuItems: any[] = []; // Store menu items that come after Theme
  isLoggedIn$: Observable<boolean>;
  isDarkTheme = false; // Add theme tracking property
  isThemeSectionOpen = false; // Add theme section tracking property
  themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'vibrant1', label: 'Cosmic Glow' },  // Fun name instead of Vibrant 1
    { value: 'vibrant2', label: 'Solar Flare' }   // Fun name instead of Vibrant 2
  ];

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  constructor(
    public authService: AuthenticationService,
    private themeService: ThemeService,
    private logger: LoggerService,
    private router: Router,
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
    this.themeService.currentTheme$.subscribe(theme => {
      this.isDarkTheme = theme === 'dark';
      this.logger.debug('Theme changed in header', { theme });
      
      // Apply appropriate theme-specific animations
      if (theme === 'vibrant1') {
        this.logger.info('Applying Cosmic Glow animations');
        // Cosmic Glow animations are applied via CSS class in the HTML
      } else if (theme === 'vibrant2') {
        this.logger.info('Applying Solar Flare animations');
        // Solar Flare animations are applied via CSS class in the HTML
      }
    });
    
    this.updateUserMenuItems(); // Initial call to set menu items
  }

  updateUserMenuItems() {
    // We'll only store Settings, Reports, and Login/Logout in remainingMenuItems
    this.remainingMenuItems = [
      { label: 'Settings', icon: 'settings', action: 'settings' },
      { label: 'Reports', icon: 'bar_chart', action: 'reports' }
    ];

    // Add login/logout as the last item
    if (this.authService.getAuthToken()) {
      this.remainingMenuItems.push({ label: 'Logout', icon: 'logout', action: 'logout' });
      this.logger.debug('Added logout option to user menu');
    } else {
      this.remainingMenuItems.push({ label: 'Login', icon: 'login', action: 'login' });
      this.logger.debug('Added login option to user menu');
    }
    
    // Note: userMenuItems is no longer used since we've restructured the template
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
    } else if (action === 'theme-light') {
      this.themeService.setTheme('light');
    } else if (action === 'theme-dark') {
      this.themeService.setTheme('dark');
    } else if (action === 'theme-vibrant1') {
      this.themeService.setTheme('vibrant1');
    } else if (action === 'theme-vibrant2') {
      this.themeService.setTheme('vibrant2');
    } else if (action === 'material-buttons') {
      this.router.navigate(['/material-buttons']);
    }
    // Handle other actions as needed
  }
  
  // Add theme toggle method
  toggleTheme() {
    this.themeService.toggleTheme();
    this.logger.info('Theme toggled', { isDarkTheme: !this.isDarkTheme });
  }

  isCurrentTheme(theme: string): boolean {
    return this.themeService.getCurrentTheme() === theme;
  }

  toggleVibrant() {
    const current = this.themeService.getCurrentTheme();
    const next = (current === 'theme-vibrant1') ? 'theme-vibrant2' : 'theme-vibrant1';
    this.handleUserMenuAction(next);
  }

  toggleThemeSection(event: Event): void {
    this.isThemeSectionOpen = !this.isThemeSectionOpen;
    // Stop event propagation to prevent menu from closing
    event.stopPropagation();
    event.preventDefault();
  }

  // Updated method to handle theme selection
  handleThemeSelection(event: MatRadioChange, theme: string): void {
    // Log the action and set the theme
    this.logger.info('[HeaderComponent] User menu action selected', { action: theme });
    this.themeService.setTheme(theme);
  }

  navigateToMaterialButtons() {
    this.logger.info('Navigating to material buttons from star');
    
    this.router.navigate(['/material-buttons']);
    this.menuTrigger.closeMenu();
    this.logger.info('Menu closed after navigation to material buttons');
  }
}
