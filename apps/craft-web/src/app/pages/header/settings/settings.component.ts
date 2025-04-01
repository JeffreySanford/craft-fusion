import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../common/services/theme.service';
import { LoggerService } from '../../../common/services/logger.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: false
})
export class SettingsComponent implements OnInit {
  currentTheme = 'light-theme';
  activeTab = 'security';
  
  navLinks = [
    { path: 'security', label: 'Security', icon: 'security' },
    { path: 'profile', label: 'Profile', icon: 'person' },
    { path: 'notifications', label: 'Notifications', icon: 'notifications' },
    { path: 'privacy', label: 'Privacy', icon: 'privacy_tip' }
  ];
  
  constructor(
    private themeService: ThemeService,
    private logger: LoggerService,
    private router: Router
  ) {
    // Remove the registerComponent call or make it conditional
    // if (this.logger.registerComponent) {
    //   this.logger.registerComponent('SettingsComponent');
    // }
  }
  
  ngOnInit(): void {
    // Get current theme
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    
    // Track active route for highlighting the correct tab
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const urlParts = event.url.split('/');
      const lastSegment = urlParts[urlParts.length - 1];
      this.activeTab = lastSegment || 'security';
      this.logger.debug('Navigation in settings', { activeTab: this.activeTab });
    });
    
    this.logger.info('Settings component initialized');
  }
}
