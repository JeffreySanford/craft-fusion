import { Component, Input, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
  standalone: false
})
export class ThemeSwitcherComponent implements OnInit {
  @Input() mini = false;
  
  currentTheme: string = 'light';
  showThemeMenu: boolean = false;
  
  themes = [
    { value: 'light', label: 'Light Mode', icon: 'light_mode' },
    { value: 'dark', label: 'Dark Mode', icon: 'dark_mode' },
    { value: 'vibrant1', label: 'Cosmic Glow', icon: 'auto_awesome' },
    { value: 'vibrant2', label: 'Solar Flare', icon: 'wb_sunny' }
  ];
  
  constructor(
    private themeService: ThemeService,
    private logger: LoggerService
  ) { }
  
  ngOnInit(): void {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }
  
  toggleThemeMenu(): void {
    this.showThemeMenu = !this.showThemeMenu;
  }
  
  selectTheme(themeValue: string): void {
    this.themeService.setTheme(themeValue);
    this.showThemeMenu = false;
    this.logger.info('Theme changed', { theme: themeValue });
  }
  
  getCurrentThemeLabel(): string {
    const theme = this.themes.find(t => t.value === this.currentTheme);
    return theme ? theme.label : 'Select Theme';
  }
  
  getCurrentThemeIcon(): string {
    const theme = this.themes.find(t => t.value === this.currentTheme);
    return theme ? theme.icon : 'settings';
  }
  
  getCurrentThemeName(): string {
    const theme = this.themes.find(t => t.value === this.currentTheme);
    return theme ? theme.label : 'Unknown Theme';
  }
}