import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { LoggerService } from '../../services/logger.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

interface ThemeOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
  standalone: false,
  animations: [
    trigger('themeSwitch', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out')
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ]),
    trigger('rotateIcon', [
      state('default', style({ transform: 'rotate(0)' })),
      state('rotated', style({ transform: 'rotate(360deg)' })),
      transition('default <=> rotated', [
        animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class ThemeSwitcherComponent implements OnInit {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showLabels: boolean = true;
  @Input() position: 'dropdown' | 'inline' = 'dropdown';
  @Output() themeChanged = new EventEmitter<string>();

  isOpen = false;
  iconState = 'default';
  currentThemeId = 'light-theme';
  
  availableThemes: ThemeOption[] = [
    {
      id: 'light-theme',
      name: 'Light',
      icon: 'light_mode',
      color: '#f8f9fa',
      description: 'Standard light theme with patriotic accents'
    },
    {
      id: 'dark-theme',
      name: 'Dark',
      icon: 'dark_mode',
      color: '#212529',
      description: 'Dark theme with patriotic accents'
    },
    {
      id: 'vibrant1-theme',
      name: 'Cosmic',
      icon: 'auto_awesome',
      color: '#9c27b0',
      description: 'Vibrant cosmic theme with purple accents'
    },
    {
      id: 'vibrant2-theme',
      name: 'Solar',
      icon: 'flare',
      color: '#ff7043',
      description: 'Vibrant solar theme with orange accents'
    }
  ];

  constructor(
    private themeService: ThemeService,
    private logger: LoggerService
  ) { }

  ngOnInit(): void {
    // Get current theme from service
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentThemeId = theme;
      this.logger.debug('Theme switcher using theme', { theme });
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.iconState = this.isOpen ? 'rotated' : 'default';
  }

  selectTheme(themeId: string): void {
    if (themeId === this.currentThemeId) return;
    
    this.themeService.setTheme(themeId);
    this.currentThemeId = themeId;
    this.themeChanged.emit(themeId);
    this.isOpen = false;
    this.iconState = 'default';
    
    this.logger.info('Theme changed', { newTheme: themeId });
  }

  getCurrentTheme(): ThemeOption {
    return this.availableThemes.find(t => t.id === this.currentThemeId) || this.availableThemes[0];
  }
}