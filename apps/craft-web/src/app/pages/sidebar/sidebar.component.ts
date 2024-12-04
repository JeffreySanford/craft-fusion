import { Component, HostListener, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

interface Item {
  icon: string;
  label: string;
  routerLink?: string;
  action?: string;
  active: boolean;
}

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
})
export class SidebarComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Input() isCollapsed = false;
  @Input() isSmallScreen = false;
  isMobile = false;

  menuItems: Item[] = [
    { icon: 'home', label: 'Home', routerLink: '/home', active: false },
    { icon: 'table_chart', label: 'Table', routerLink: '/table', active: false },
    { icon: 'bar_chart', label: 'Data Visualizations', routerLink: '/data-visualizations', active: false },
    { icon: 'restaurant', label: 'Peasant Kitchen', routerLink: '/peasant-kitchen', active: false },
    { icon: 'movie', label: 'HTML Video', routerLink: '/space-video', active: false }
  ];

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const width = (event.target as Window).innerWidth;
    this.isCollapsed = width < 900;
    this.sidebarToggle.emit(!this.isCollapsed);
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(!this.isCollapsed);
  }

  setActive(item: Item) {
    this.menuItems.forEach(menuItem => menuItem.active = false);
    item.active = true;
  }

  getActiveItemLabel(): string {
    const activeItem = this.menuItems.find(item => item.active);
    return activeItem ? activeItem.label : '';
  }

  onDrawerOpen() {
    console.log('Drawer opened');
  }

  onDrawerClose() {
    console.log('Drawer closed');
  }
}