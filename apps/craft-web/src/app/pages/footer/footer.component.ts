import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { LayoutService } from '../../common/services/layout.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false, // Using NgModule instead of standalone
  animations: [
    trigger('expandFooter', [
      state('collapsed', style({
        height: '60px', // Default collapsed height
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '300px', // Match the CSS variable for expanded height
        overflow: 'hidden'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class FooterComponent implements OnInit, OnDestroy {
  @HostBinding('class.expanded') public isExpanded = false;
  public currentYear: number = new Date().getFullYear();
  private destroy$ = new Subject<void>();
  
  // Footer links and content
  public footerLinks = [
    { category: 'About Us', links: [
      { title: 'Our Story', url: '/about' },
      { title: 'Our Team', url: '/team' },
      { title: 'Careers', url: '/careers' }
    ]},
    { category: 'Services', links: [
      { title: 'Overview', url: '/services' },
      { title: 'Consulting', url: '/consulting' },
      { title: 'Development', url: '/development' }
    ]},
    { category: 'Resources', links: [
      { title: 'Blog', url: '/blog' },
      { title: 'Guides', url: '/guides' },
      { title: 'Webinars', url: '/webinars' }
    ]},
    { category: 'Contact', links: [
      { title: 'Contact Us', url: '/contact' },
      { title: 'Support', url: '/support' },
      { title: 'Feedback', url: '/feedback' }
    ]}
  ];
  
  // Social links
  public socialLinks = [
    { icon: 'twitter', url: 'https://twitter.com', label: 'Twitter' },
    { icon: 'linkedin', url: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: 'code', url: 'https://github.com', label: 'GitHub' }
  ];
  
  constructor(private layoutService: LayoutService) {}
  
  ngOnInit(): void {
    // Subscribe to footer expanded state changes
    this.layoutService.footerExpanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(expanded => {
        this.isExpanded = expanded;
        // When the layout service updates the state, we don't need to call toggleFooter again
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Toggle footer expanded state
   * @param event Click event
   */
  public toggleFooter(event?: MouseEvent): void {
    // Prevent event propagation if provided
    if (event) {
      event.stopPropagation();
    }
    
    this.layoutService.toggleFooterExpanded();
  }
  
  /**
   * Get the current animation state
   */
  public get footerState(): string {
    return this.isExpanded ? 'expanded' : 'collapsed';
  }
}