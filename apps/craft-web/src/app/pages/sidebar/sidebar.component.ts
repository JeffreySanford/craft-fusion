import { Component, HostListener, EventEmitter, Output, Input, OnInit, ViewChild, ChangeDetectorRef, Renderer2, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDrawer } from '@angular/material/sidenav';
import { MenuItem, MenuGroup } from './sidebar.types'
import { Router } from '@angular/router';
import { SidebarStateService } from '../../common/services/sidebar-state.service';
import { AdminStateService } from '../../common/services/admin-state.service';

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

export class SidebarComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Input() isSmallScreen = false;
  @Input() isCollapsed = false;
  @ViewChild('drawer') drawer!: MatDrawer;
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
      ],
    }
  ];
  menuItems: MenuItem[] = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
  constructor(
    private breakpointObserver: BreakpointObserver, 
    private router: Router,
    private sidebarStateService: SidebarStateService,
    private adminStateService: AdminStateService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });

    this.adminStateService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (isAdmin) {
        // Check if the admin item already exists to avoid duplicates
        const adminItemIndex = this.menuGroups[0].items.findIndex(item => item.label === 'Admin');
        if (adminItemIndex === -1) {
          this.menuGroups[0].items.push({ icon: 'admin_panel_settings', label: 'Admin', routerLink: '/admin', active: false });
          this.menuGroups[0].items.push({ icon: 'family_restroom', label: 'Family', routerLink: '/family', active: false });
          this.menuGroups[0].items.push({ icon: 'chat_bubble', label: 'Chat', routerLink: '/chat', active: false });
          this.menuGroups[0].items.push({ icon: 'book', label: 'Book', routerLink: '/book', active: false });
          this.menuItems = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
        }
      } else {
        // Remove the admin item if it exists
        const adminItemIndex = this.menuGroups[0].items.findIndex(item => item.label === 'Admin');
        if (adminItemIndex !== -1) {
          this.menuGroups[0].items.splice(adminItemIndex, 1);
          this.menuItems = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
        }
      }
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