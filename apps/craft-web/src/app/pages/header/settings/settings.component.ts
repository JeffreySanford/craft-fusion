import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from '../../../common/services/theme.service';
import { NotificationService } from '../../../common/services/notification.service';
import { UserPreferencesService } from '../../../common/services/user-preferences.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface SettingsGroup {
  title: string;
  icon: string;
  settings: SettingsItem[];
}

interface SettingsItem {
  type: 'toggle' | 'select' | 'radio' | 'slider' | 'input' | 'custom';
  label: string;
  key: string;
  value: any;
  options?: { value: any, label: string, icon?: string }[];
  description?: string;
  disabled?: boolean;
  advanced?: boolean;
  requiresRestart?: boolean;
  experimental?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  template?: any;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: false,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('expandSection', [
      state('collapsed', style({ height: '0', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class SettingsComponent implements OnInit, OnDestroy {
  themeClass = '';
  showAdvanced = false;
  activeTheme = 'light';
  availableThemes = [
    { value: 'light', label: 'Light', icon: 'wb_sunny' },
    { value: 'dark', label: 'Dark', icon: 'nights_stay' },
    { value: 'vibrant1', label: 'Cosmic Glow', icon: 'auto_awesome' },
    { value: 'vibrant2', label: 'Solar Flare', icon: 'local_fire_department' }
  ];
  
  settingsGroups: SettingsGroup[] = [
    {
      title: 'Appearance',
      icon: 'palette',
      settings: [
        {
          type: 'select',
          label: 'Theme',
          key: 'theme',
          value: 'light',
          options: this.availableThemes
        },
        {
          type: 'toggle',
          label: 'Use system theme',
          key: 'useSystemTheme',
          value: false,
          description: 'Follow your device\'s light/dark theme setting'
        },
        {
          type: 'toggle',
          label: 'Show animations',
          key: 'showAnimations',
          value: true
        },
        {
          type: 'toggle',
          label: 'High contrast mode',
          key: 'highContrastMode',
          value: false,
          advanced: true
        }
      ]
    },
    {
      title: 'Notifications',
      icon: 'notifications',
      settings: [
        {
          type: 'toggle',
          label: 'Enable notifications',
          key: 'enableNotifications',
          value: true
        },
        {
          type: 'toggle',
          label: 'Play sound for notifications',
          key: 'notificationSound',
          value: true
        },
        {
          type: 'select',
          label: 'Notification position',
          key: 'notificationPosition',
          value: 'top-right',
          options: [
            { value: 'top-right', label: 'Top Right', icon: 'north_east' },
            { value: 'top-left', label: 'Top Left', icon: 'north_west' },
            { value: 'bottom-right', label: 'Bottom Right', icon: 'south_east' },
            { value: 'bottom-left', label: 'Bottom Left', icon: 'south_west' }
          ]
        }
      ]
    },
    {
      title: 'Privacy',
      icon: 'security',
      settings: [
        {
          type: 'toggle',
          label: 'Analytics',
          key: 'enableAnalytics',
          value: true,
          description: 'Send anonymous usage data to help improve the application'
        },
        {
          type: 'toggle',
          label: 'Remember recent searches',
          key: 'rememberSearches',
          value: true
        },
        {
          type: 'toggle',
          label: 'Autosave content',
          key: 'autosaveContent',
          value: true
        }
      ]
    },
    {
      title: 'Advanced',
      icon: 'tune',
      settings: [
        {
          type: 'toggle',
          label: 'Developer mode',
          key: 'developerMode',
          value: false,
          advanced: true,
          requiresRestart: true
        },
        {
          type: 'toggle',
          label: 'Enable experimental features',
          key: 'experimentalFeatures',
          value: false,
          advanced: true,
          experimental: true
        },
        {
          type: 'select',
          label: 'Log level',
          key: 'logLevel',
          value: 'info',
          options: [
            { value: 'error', label: 'Error' },
            { value: 'warn', label: 'Warning' },
            { value: 'info', label: 'Info' },
            { value: 'debug', label: 'Debug' },
            { value: 'trace', label: 'Trace' }
          ],
          advanced: true
        }
      ]
    }
  ];
  
  expandedGroups: string[] = ['Appearance'];
  
  private destroy$ = new Subject<void>();
  private hasChanges = false;
  
  constructor(
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private userPreferencesService: UserPreferencesService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });
      
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.activeTheme = theme;
        this.updateSettingValue('Appearance', 'theme', theme);
      });
      
    // Load user preferences
    this.loadSettings();
  }
  
  ngOnDestroy(): void {
    if (this.hasChanges) {
      this.saveSettings();
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }
  
  toggleGroupExpansion(title: string): void {
    if (this.isGroupExpanded(title)) {
      this.expandedGroups = this.expandedGroups.filter(group => group !== title);
    } else {
      this.expandedGroups.push(title);
    }
  }
  
  isGroupExpanded(title: string): boolean {
    return this.expandedGroups.includes(title);
  }
  
  onSettingChange(group: SettingsGroup, setting: SettingsItem, value: any): void {
    setting.value = value;
    this.hasChanges = true;
    
    // Handle specific settings that need immediate effect
    if (group.title === 'Appearance' && setting.key === 'theme') {
      this.themeService.setTheme(value);
    }
    
    // Handle setting that requires restart
    if (setting.requiresRestart) {
      this.notificationService.showInfo(`The change to "${setting.label}" will take effect after restart.`);
    }
    
    // Handle special cases for certain settings
    if (setting.key === 'useSystemTheme' && setting.value) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeService.setTheme(prefersDark ? 'dark' : 'light');
    }
    
    // Handle experimental features warning
    if (setting.experimental && setting.value) {
      this.notificationService.showWarning('You have enabled an experimental feature which may not be stable.');
    }
  }
  
  saveSettings(): void {
    // Combine all settings into a single object
    const settings: Record<string, any> = {};
    
    this.settingsGroups.forEach(group => {
      group.settings.forEach(setting => {
        settings[setting.key] = setting.value;
      });
    });
    
    // Save to user preferences service
    this.userPreferencesService.savePreferences(settings);
    
    this.notificationService.showSuccess('Settings saved successfully.');
    this.hasChanges = false;
  }
  
  resetSettings(): void {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.loadDefaultSettings();
      this.notificationService.showInfo('Settings reset to default values.');
      this.hasChanges = true;
    }
  }
  
  private loadSettings(): void {
    this.userPreferencesService.getPreferences()
      .pipe(takeUntil(this.destroy$))
      .subscribe(userPreferences => {
        // Apply saved values to our settings model
        this.settingsGroups.forEach(group => {
          group.settings.forEach(setting => {
            if (userPreferences[setting.key] !== undefined) {
              setting.value = userPreferences[setting.key];
            }
          });
        });
      });
  }
  
  private loadDefaultSettings(): void {
    // Reset all settings to their default values
    // You could define defaults separately or use a reset API
    this.settingsGroups.forEach(group => {
      if (group.title === 'Appearance') {
        this.updateSettingValue(group.title, 'theme', 'light');
        this.updateSettingValue(group.title, 'useSystemTheme', false);
        this.updateSettingValue(group.title, 'showAnimations', true);
        this.updateSettingValue(group.title, 'highContrastMode', false);
        this.themeService.setTheme('light');
      } else if (group.title === 'Notifications') {
        this.updateSettingValue(group.title, 'enableNotifications', true);
        this.updateSettingValue(group.title, 'notificationSound', true);
        this.updateSettingValue(group.title, 'notificationPosition', 'top-right');
      } else if (group.title === 'Privacy') {
        this.updateSettingValue(group.title, 'enableAnalytics', true);
        this.updateSettingValue(group.title, 'rememberSearches', true);
        this.updateSettingValue(group.title, 'autosaveContent', true);
      } else if (group.title === 'Advanced') {
        this.updateSettingValue(group.title, 'developerMode', false);
        this.updateSettingValue(group.title, 'experimentalFeatures', false);
        this.updateSettingValue(group.title, 'logLevel', 'info');
      }
    });
  }
  
  private updateSettingValue(groupTitle: string, key: string, value: any): void {
    const group = this.settingsGroups.find(g => g.title === groupTitle);
    if (group) {
      const setting = group.settings.find(s => s.key === key);
      if (setting) {
        setting.value = value;
      }
    }
  }
  
  // Helper methods for template binding to avoid errors
  getThemeName(themeValue: string): string {
    const theme = this.availableThemes.find(t => t.value === themeValue);
    return theme ? theme.label : 'Current Theme';
  }
  
  getThemeIcon(themeValue: string): string {
    const theme = this.availableThemes.find(t => t.value === themeValue);
    return theme ? theme.icon : 'palette';
  }
}
