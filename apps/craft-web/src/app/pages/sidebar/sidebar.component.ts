import { Component, HostListener, EventEmitter, Output, Input, OnInit, ViewChild, ChangeDetectorRef, Renderer2, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDrawer } from '@angular/material/sidenav';
import { MenuItem, MenuGroup } from './sidebar.types'
import { Router } from '@angular/router';
import { SidebarStateService } from '../../common/services/sidebar-state.service';
import { AdminStateService } from '../../common/services/admin-state.service';
import { AuthenticationService } from '../../common/services/authentication.service';

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
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SidebarComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Input() isSmallScreen = false;
  @Input() isCollapsed = false;
  @ViewChild('drawer') drawer!: MatDrawer;
  isMobile = false;
  isAdmin = false; // For demonstration, set or derive from user state

  // Observable for admin state - initialized in constructor
  isAdmin$!: Observable<boolean>;

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
      ],
    }
  ];
  menuItems: MenuItem[] = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
  constructor(
    private breakpointObserver: BreakpointObserver, 
    private router: Router,
    private sidebarStateService: SidebarStateService,
    private _adminStateService: AdminStateService,
    private authService: AuthenticationService,
    private cdr: ChangeDetectorRef,
    private _renderer: Renderer2,
    private _el: ElementRef
  ) {
    console.log('🔧 Sidebar: Constructor called');
    // Initialize the admin observable in constructor
    this.isAdmin$ = this.authService.isAdmin$;
    // Reference unused injected services to avoid 'declared but never read' TS errors
    void this._adminStateService;
    void this._renderer;
    void this._el;
  }

  ngOnInit() {
    console.log('🔧 Sidebar: ngOnInit called');
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });

    // Subscribe to admin state changes for menu updates
    console.log('🔧 Sidebar: Setting up admin state subscription');
    this.isAdmin$.subscribe(isAdmin => {
      console.log('🔧 Sidebar: Admin state changed to:', isAdmin);
      this.isAdmin = isAdmin;
      if (isAdmin) {
        // Check if the admin item already exists to avoid duplicates
        if (this.menuGroups?.[0]?.items) {
          const adminItemIndex = this.menuGroups[0].items.findIndex(item => item.label === 'Admin');
          if (adminItemIndex === -1) {
            console.log('🔧 Sidebar: Adding admin menu items');
            this.menuGroups[0].items.push(
              { icon: 'admin_panel_settings', label: 'Admin', routerLink: '/admin', active: false },
              { icon: 'family_restroom', label: 'Family', routerLink: '/family', active: false },
              { icon: 'chat_bubble', label: 'Chat', routerLink: '/chat', active: false },
              { icon: 'book', label: 'Book', routerLink: '/book', active: false }
            );
          }
        }
      } else {
        // Remove all admin items if they exist
        if (this.menuGroups?.[0]?.items) {
          console.log('🔧 Sidebar: Removing admin menu items');
          this.menuGroups[0].items = this.menuGroups[0].items.filter(item => 
            !['Admin', 'Family', 'Chat', 'Book'].includes(item.label)
          );
        }
      }
      // Create new array reference to trigger change detection
      this.menuItems = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
      console.log('🔧 Sidebar: Menu items updated, length:', this.menuItems.length);
      this.cdr.detectChanges();
    });

    this.router.events.subscribe(() => {
      const activeRoute = this.router.url;
      this.menuItems.forEach(item => {
        item.active = item.routerLink === activeRoute;
      });
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const width = (event.target as Window).innerWidth;
    this.isCollapsed = width < 900;
    this.isSmallScreen = width < 900;
  
    this.sidebarToggle.emit(!this.isCollapsed);
    this.sidebarStateService.toggleSidebar(this.isCollapsed);
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(!this.isCollapsed);
    this.sidebarStateService.toggleSidebar(this.isCollapsed);
  }

  setActive(item: MenuItem) {
    this.menuItems.forEach(menuItem => menuItem.active = false);
    item.active = true;
  }

  getActiveItemLabel(): string {
    const activeItem = this.menuItems.find(item => item.active);
    return activeItem ? activeItem.label : '';
  }

  toggleMenu() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarStateService.toggleSidebar(this.isCollapsed);
    if (this.isSmallScreen) {
      this.drawer.toggle();
    }
  }

  get toggleIcon(): string {
    return this.isCollapsed ? 'arrow_forward_ios' : 'menu_open';
  }
}