import { Component, OnDestroy, OnInit } from '@angular/core';
import { LayoutService } from '../../common/services/layout.service';
import { ThemeService } from '../../common/services/theme.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { LoggerService } from '../../common/services/logger.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  animations: [
    trigger('fadeInContent', [
      transition(':enter', [
        query('.feature-card', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0px)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  standalone: false // Preserve this value!
})
export class LandingComponent implements OnInit, OnDestroy {
  currentTheme: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private layoutService: LayoutService,
    private themeService: ThemeService,
    private logger: LoggerService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit() {
    // Configure layout to give landing page full viewport
    this.layoutService.setSidebarCollapsed(true);
    this.layoutService.configureLayout({
      hideSidebar: true   // Hide sidebar completely
    });
    
    // Subscribe to theme changes
    this.subscriptions.push(
      this.themeService.currentTheme$.subscribe(theme => {
        this.currentTheme = theme;
        this.logger.debug('Theme changed on landing page', { theme });
      })
    );
    
    this.logger.info('Landing page initialized');
  }

  ngOnDestroy() {
    // Reset layout to default settings
    this.layoutService.resetLayout();
    
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    this.logger.info('Landing page destroyed');
  }
}
