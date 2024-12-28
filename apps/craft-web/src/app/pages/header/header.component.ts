import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  title = 'frontend';
  isExpanded = false;
  isSmallScreen = false;
  isCollapsed = false;
  menuItems = [
    { label: 'Home', icon: 'home', routerLink: '/home', active: false },
    // Add more menu items as needed
  ];
  polling = true;

  constructor() {}

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    item.active = true;
  }
  
}
