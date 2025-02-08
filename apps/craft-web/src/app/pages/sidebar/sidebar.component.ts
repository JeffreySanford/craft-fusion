import { Component, HostListener, EventEmitter, Output, Input, OnInit, ViewChild } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDrawer } from '@angular/material/sidenav';
import { MenuItem, MenuGroup } from './sidebar.types'
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false,
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
  }
})

export class SidebarComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Input() isSmallScreen = false;
  @Input() isCollapsed = false;
  @ViewChild('drawer') drawer!: MatDrawer;
  isMobile = false;

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
        { icon: 'book', label: 'Book', routerLink: '/book', active: false }
      ],
    }
  ];
  menuItems: MenuItem[] = this.menuGroups.reduce((acc: MenuItem[], group) => acc.concat(group.items), []);
  
  constructor(private breakpointObserver: BreakpointObserver, private router: Router) {}

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
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
    this.isSmallScreen = true;
  
    this.sidebarToggle.emit(!this.isCollapsed);
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(!this.isCollapsed);
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
    if (this.isSmallScreen) {
      this.drawer.toggle();
    }
  }
}