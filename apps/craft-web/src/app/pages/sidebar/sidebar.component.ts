import { Component, OnInit, OnDestroy, HostListener, ElementRef, ChangeDetectorRef, Input, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LayoutService } from '../../common/services/layout.service';
import { ThemeService } from '../../common/services/theme.service';
import { AuthenticationService } from '../../common/services/authentication.service';
import { NavItem } from './sidebar.types';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;

  // Navigation items
  navItems: NavItem[] = [
    {
      text: 'Home',
      route: '/landing',
      icon: 'home',
      visible: true
    },
    {
      text: 'Projects',
      icon: 'work',
      expanded: false,
      children: [
        {
          text: 'Material Table',
          route: '/projects/table',
          icon: 'table_chart',
          visible: true
        },
        {
          text: 'Data Visualizations',
          route: '/projects/data-visualizations',
          icon: 'insights',
          visible: true
        },
        {
          text: 'Space Video',
          route: '/projects/space-video',
          icon: 'movie',
          visible: true
        },
        {
          text: 'Peasant Kitchen',
          route: '/projects/peasant-kitchen',
          icon: 'restaurant',
          visible: true
        },
        {
          text: 'Document AI Parsing',
          route: '/projects/book',
          icon: 'menu_book',
          visible: true
        }
      ],
      visible: true
    },
    {
      text: 'Reports',
      route: '/reports',
      icon: 'assessment',
      visible: true
    },
    {
      text: 'Resume',
      route: '/resume',
      icon: 'description',
      visible: true
    },
    {
      text: 'Admin',
      route: '/admin',
      icon: 'admin_panel_settings',
      visible: false
    }
  ];

  // UI State
  activeRoute = '';
  resizeStartX = 0;
  currentWidth = 250; // Default sidebar width
  isMobileView = false;
  isAdmin = false;
  currentTheme: string = 'light-theme'; // Initialize the property with a default value
  public isSidebarExpanded = true;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private layoutService: LayoutService,
    private themeService: ThemeService,
    private authService: AuthenticationService,
    private renderer: Renderer2,
    private el: ElementRef,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();

    // Track sidebar collapsed state from LayoutService
    this.layoutService.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((collapsed: boolean) => {
        this.isSidebarExpanded = !collapsed;
        this.collapsed = collapsed;
      });

    // Track sidebar width from LayoutService
    this.layoutService.sidebarWidth$
      .pipe(takeUntil(this.destroy$))
      .subscribe((width: number) => {
        this.currentWidth = width;
      });

    // Track mobile state
    this.layoutService.isSmallScreen$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isSmall: boolean) => {
        this.isMobileView = isSmall;
        this.changeDetectorRef.markForCheck();

        // Auto-collapse on mobile
        if (isSmall && !this.collapsed) {
          this.toggleSidebar();
        }
      });

    // Track active route for highlighting
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.activeRoute = event.urlAfterRedirects;

        // Automatically expand the projects section if a project route is active
        if (this.activeRoute.includes('/projects/')) {
          const projectsItem = this.navItems.find(item => item.text === 'Projects');
          if (projectsItem) {
            projectsItem.expanded = true;
          }
        }
      });

    // Check if user has admin rights
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.changeDetectorRef.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleExpand(item: NavItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  isActive(route: string | undefined): boolean {
    if (!route) return false;
    return this.activeRoute === route || this.activeRoute.startsWith(`${route}/`);
  }

  isChildActive(parent: NavItem): boolean {
    if (!parent.children) return false;
    return parent.children.some(child => this.isActive(child.route));
  }

  navigate(route: string): void {
    if (route) {
      this.router.navigate([route]);

      // Auto-collapse sidebar on mobile after navigation
      if (this.isMobileView && !this.collapsed) {
        this.toggleSidebar();
      }
    }
  }

  /**
   * Toggle sidebar expanded/collapsed state
   */
  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  /**
   * Start sidebar resize
   * @param event Mouse event
   */
  startResize(event: MouseEvent): void {
    this.resizeStartX = event.clientX;

    // Add event listeners for drag and release
    this.renderer.listen('document', 'mousemove', this.onResizeMove);
    this.renderer.listen('document', 'mouseup', this.onResizeEnd);
  }

  /**
   * End sidebar resize
   */
  onResizeEnd = (): void => {
    // Remove event listeners
    this.renderer.listen('document', 'mousemove', this.onResizeMove);
    this.renderer.listen('document', 'mouseup', this.onResizeEnd);

    // Get computed width after drag - must use native element for measurement
    const computedWidth = this.el.nativeElement.getBoundingClientRect().width;

    // Update service with final width
    this.layoutService.setSidebarWidth(computedWidth);
  };

  onResizeMove = (event: MouseEvent) => {
    const deltaX = event.clientX - this.resizeStartX;
    const newWidth = this.currentWidth + deltaX;

    // Apply width using Renderer2
    this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
    this.resizeStartX = event.clientX;
  };

  // Expand sidebar when hovered in collapsed state on desktop
  onMouseEnter(): void {
    if (this.collapsed && !this.isMobileView) {
      // Temporarily expand sidebar for hover preview
      this.renderer.addClass(this.el.nativeElement, 'hover-expanded');
    }
  }

  onMouseLeave(): void {
    if (this.collapsed && !this.isMobileView) {
      // Remove temporary expanded state
      this.renderer.removeClass(this.el.nativeElement, 'hover-expanded');
    }
  }
}