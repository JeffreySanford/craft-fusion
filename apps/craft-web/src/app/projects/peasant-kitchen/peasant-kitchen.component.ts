import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-peasant-kitchen',
  templateUrl: './peasant-kitchen.component.html',
  styleUrls: ['./peasant-kitchen.component.scss'],
  standalone: false,
})
export class PeasantKitchenComponent implements OnInit {
  showBackButton = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        debugger
        // Show back button only if we're on a specific recipe route
        this.showBackButton = event.url.includes('peasant-kitchen/recipe/');
      }
    });
  }

  /**
   * Navigate back to the recipes list
   */
  goBackToRecipes(): void {
    console.log('Back button pressed, returning to parent container.');
    this.router.navigate(['peasant-kitchen']);
  }
}
