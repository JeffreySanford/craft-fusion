import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-peasant-kitchen',
  templateUrl: './peasant-kitchen.component.html',
  styleUrls: ['./peasant-kitchen.component.scss'],
  standalone: false,
})
export class PeasantKitchenComponent implements OnInit, OnDestroy {
  showBackButton = false;
  private routerSubscription!: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {

        this.showBackButton = event.url.includes('peasant-kitchen/recipe/');
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  goBackToRecipes(): void {
    console.log('Back button pressed, returning to parent container.');
    this.router.navigate(['peasant-kitchen']);
  }
}
