import { Component, HostListener, EventEmitter, Output, Input, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDrawer } from '@angular/material/sidenav';
import { MenuItem, MenuGroup } from './sidebar.types';
import { Router } from '@angular/router';
import { SidebarStateService } from '../../common/services/sidebar-state.service';
import { AuthorizationService } from '../../common/services/authorization.service';
import { AdminStateService } from '../../common/services/admin-state.service';
import { LayoutService } from '../../common/services/layout.service';
import { LoggerService } from '../../common/services/logger.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'translateX(0)' })),
      state('out', style({ transform: 'translateX(0)' })),
      transition('in => out', [animate('1s ease-in')]),
      transition('out => in', [animate('1s ease-out')]),
    ]),
  ],
  host: {
    '[class.collapsed]': 'isCollapsed'
  },
  standalone: false
})
export class SidebarComponent implements OnInit, AfterViewInit {
  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Input() isSmallScreen = false;
  @Input() isCollapsed = false;
  @ViewChild('drawer') drawer!: MatDrawer;
  @ViewChild('sidebarContainer') sidebarContainer!: ElementRef;

  isMobile = false;
  isAdmin = false; // For demonstration, set or derive from user state

  menuGroups: MenuGroup[] = [
    {
      title: 'Main',
      icon: 'home',
      items: [
        { icon: 'home', label: 'Home', routerLink: '/home', active: true },
        { icon: 'table_chart', label: 'Table', routerLink: '/table', active: false },
        { icon: 'bar_chart', label: 'Data Visualizations', routerLink: '/data-visualizations', active: false },
        { icon: 'restaurant', label: 'Peasant Kitchen', routerLink: '/peasant-kitchen', active: false },
        { icon: 'movie', label: 'HTML Video', routerLink: '/space-video', active: false },
        { icon: 'chat', label: 'Chat', routerLink: '/chat', active: false },
        { icon: 'book', label: 'Book', routerLink: '/book', active: false },
      ],
    }
  ];
  menuItems: MenuItem[] = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private router: Router,
    private sidebarStateService: SidebarStateService,
    private authorizationService: AuthorizationService,
    private adminStateService: AdminStateService,
    private cdr: ChangeDetectorRef,
    private layoutService: LayoutService,
    private renderer: Renderer2,
    private logger: LoggerService
  ) {
    this.logger.registerService('SidebarComponent');
    this.logger.info('Sidebar component initialized', {
      type: 'COMPONENT_STYLING'
    });
  }

  ngOnInit() {
    this.logger.info('Sidebar component initialized');
    this.logger.debug('Setting up sidebar breakpoint observers', {
      type: 'COMPONENT_STYLING'
    });
    
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.logger.debug('Breakpoint observer update', {
          type: 'COMPONENT_STYLING', 
          isMobile: this.isMobile
        });
      });

    this.adminStateService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      this.logger.debug('Admin state changed in sidebar', {
        type: 'COMPONENT_STYLING',
        isAdmin
      });
      
      if (isAdmin) {
        const adminItemIndex = this.menuGroups[0].items.findIndex(item => item.label === 'Admin');
        if (adminItemIndex === -1) {
          // Add admin button with a clear identifier
          this.menuGroups[0].items.push({ 
            icon: 'admin_panel_settings', 
            label: 'Admin', 
            routerLink: '/admin', 
            active: false,
            isAdmin: true // Add explicit flag for admin items
          });
          this.menuItems = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
          this.logger.info('Admin button added to sidebar', { route: '/admin' });
        }
      } else {
        const adminItemIndex = this.menuGroups[0].items.findIndex(item => item.label === 'Admin');
        if (adminItemIndex !== -1) {
          this.menuGroups[0].items.splice(adminItemIndex, 1);
          this.menuItems = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
          this.logger.info('Admin button removed from sidebar');
        }
      }
      this.cdr.detectChanges();
    });

    this.router.events.subscribe(() => {
      const activeRoute = this.router.url;
      this.menuGroups.forEach(group => {
        group.items.forEach(item => {
          item.active = item.routerLink === activeRoute;
        });
      });
      
      this.menuItems = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
    });

    this.logger.debug('Sidebar setup complete');
  }

  ngAfterViewInit(): void {
    this.logger.debug('Sidebar view initialized, calculating button widths', {
      type: 'COMPONENT_STYLING'
    });
    
    setTimeout(() => {
      this.layoutService.calculateSidebarButtonWidth(
        this.sidebarContainer, 
        '.menu-item',
        this.renderer
      );
    }, 100);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const width = (event.target as Window).innerWidth;
    this.isCollapsed = width < 900;
    this.isSmallScreen = true;
  
    this.sidebarToggle.emit(!this.isCollapsed);
    this.sidebarStateService.toggleSidebar(this.isCollapsed);
    
    this.logger.debug('Window resize detected', {
      type: 'COMPONENT_STYLING',
      width,
      isCollapsed: this.isCollapsed
    });
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(!this.isCollapsed);
    this.sidebarStateService.toggleSidebar(this.isCollapsed);
    
    this.logger.info('Sidebar collapsed state toggled', {
      type: 'COMPONENT_STYLING',
      isCollapsed: this.isCollapsed
    });
  }

  setActive(item: MenuItem) {
    this.menuGroups.forEach(group => {
      group.items.forEach(menuItem => menuItem.active = (menuItem === item));
    });
    
    this.menuItems = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
  }

  getActiveItemLabel(): string {
    const activeItem = this.menuItems.find(item => item.active);
    return activeItem ? activeItem.label : '';
  }

  toggleMenu() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarStateService.toggleSidebar(this.isCollapsed);
    
    this.logger.info('Sidebar menu toggled', {
      type: 'COMPONENT_STYLING',
      isCollapsed: this.isCollapsed
    });
    
    if (this.isSmallScreen) {
      this.drawer.toggle();
      this.logger.debug('Toggled drawer for small screen', {
        type: 'COMPONENT_STYLING'
      });
    }
  }

  get toggleIcon(): string {
    return this.isCollapsed ? 'arrow_forward_ios' : 'menu_open';
  }
}