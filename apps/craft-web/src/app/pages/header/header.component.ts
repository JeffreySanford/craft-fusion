import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../common/services/authentication.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent implements OnInit {
  title = 'frontend';
  isExpanded = false;
  isSmallScreen = false;
  isCollapsed = false;
  menuItems = [
    { label: 'Home', icon: 'home', routerLink: '/home', active: false },
    // Add more menu items as needed
  ];
  polling = true;

  userMenuItems: any[] = []; // Initialize as empty array
  isLoggedIn$: Observable<boolean>;

  constructor(public authService: AuthenticationService) { // Inject auth service
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(() => {
      this.updateUserMenuItems();
    });
    this.updateUserMenuItems(); // Initial call to set menu items
  }

  updateUserMenuItems() {
    this.userMenuItems = [
      { label: 'Profile', icon: 'person', action: 'profile' },
      { label: 'Settings', icon: 'settings', action: 'settings' },
      { label: 'Theme', icon: 'palette', action: 'theme' },
      { label: 'Reports', icon: 'bar_chart', action: 'reports' }
    ];

    if (this.authService.getAuthToken()) {
      this.userMenuItems.push({ label: 'Logout', icon: 'logout', action: 'logout' });
    } else {
      this.userMenuItems.push({ label: 'Login', icon: 'login', action: 'login' });
    }
  }

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    item.active = true;
  }

  handleUserMenuAction(action: string) {
    if (action === 'login') {
      this.authService.login('test', 'test').subscribe(() => {
        this.updateUserMenuItems();
      });
    } else if (action === 'logout') {
      this.authService.logout();
      this.updateUserMenuItems();
    }
    // Handle other actions as needed
  }
}
