import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
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

  userMenuItems = [
    { label: 'Profile', icon: 'person', action: 'profile' },
    { label: 'Settings', icon: 'settings', action: 'settings' },
    { label: 'Theme', icon: 'palette', action: 'theme' },
    { label: 'Reports', icon: 'bar_chart', action: 'reports' },
    { label: 'Login', icon: 'login', action: 'login' }
  ];

  constructor() {}

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    item.active = true;
  }

  handleUserMenuAction(action: string) {
    if (action === 'login') {
      // Trigger login logic here
      console.log('Login triggered');
    }
    // Handle other actions as needed
  }
}
