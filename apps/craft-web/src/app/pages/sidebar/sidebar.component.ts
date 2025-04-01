import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LayoutService } from '../../common/services/layout.service';
import { ThemeService } from '../../common/services/theme.service';
import { NavItem } from './sidebar.types';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false
})
export class SidebarComponent implements OnInit, OnDestroy {
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
          text: 'Table Demo',
          route: '/projects/table',
          icon: 'table_chart',
          visible: true
        },
        {
          text: 'Peasant Kitchen',
          route: '/projects/peasant-kitchen',
          icon: 'restaurant',
          visible: true
        },
        {
          text: 'Book Viewer',
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
      visible: true
    }
  ];

  // UI State
  collapsed = false;
  activeRoute = '';
  resizing = false;
  resizeStartX = 0;
  currentWidth = 250; // Default sidebar width
  isMobile = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private layoutService: LayoutService,
    private themeService: ThemeService,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    // Track sidebar collapsed state from LayoutService
    this.layoutService.sidebarExpanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(expanded => {
        this.collapsed = !expanded;
      });

    // Track sidebar width from LayoutService
    this.layoutService.sidebarWidth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(width => {
        this.currentWidth = width;
      });
    
    // Track resizing state from LayoutService
    this.layoutService.sidebarResizing$
      .pipe(takeUntil(this.destroy$))
      .subscribe(resizing => {
        this.resizing = resizing;
      });

    // Track mobile state
    this.layoutService.isMobile()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        
        // Auto-collapse on mobile
        if (isMobile && !this.collapsed) {
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
      if (this.isMobile && !this.collapsed) {
        this.toggleSidebar();
      }
    }
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebarExpanded();
  }

  // Resize functionality
  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.resizeStartX = event.clientX;
    this.layoutService.startSidebarResize();
    
    // Add event listeners for drag and release
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  @HostListener('document:mousemove', ['$event'])
  onDragMove = (event: MouseEvent) => {
    if (this.resizing) {
      const deltaX = event.clientX - this.resizeStartX;
      const newWidth = this.currentWidth + deltaX;
      
      // Apply width directly during drag for responsive feel
      this.el.nativeElement.style.width = `${newWidth}px`;
      this.resizeStartX = event.clientX;
    }
  }

  @HostListener('document:mouseup')
  onDragEnd = () => {
    if (this.resizing) {
      // Get computed width after drag
      const computedWidth = this.el.nativeElement.getBoundingClientRect().width;
      
      // Update service with final width
      this.layoutService.setSidebarWidth(computedWidth);
      this.layoutService.endSidebarResize();
      
      // Remove event listeners
      document.removeEventListener('mousemove', this.onDragMove);
      document.removeEventListener('mouseup', this.onDragEnd);
    }
  }

  // Expand sidebar when hovered in collapsed state on desktop
  onMouseEnter(): void {
    if (this.collapsed && !this.isMobile) {
      // Temporarily expand sidebar for hover preview
      this.el.nativeElement.classList.add('hover-expanded');
    }
  }

  onMouseLeave(): void {
    if (this.collapsed && !this.isMobile) {
      // Remove temporary expanded state
      this.el.nativeElement.classList.remove('hover-expanded');
    }
  }
}