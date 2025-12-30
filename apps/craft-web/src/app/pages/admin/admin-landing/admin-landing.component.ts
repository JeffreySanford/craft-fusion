import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-landing',
  templateUrl: './admin-landing.component.html',
  styleUrls: ['./admin-landing.component.scss'],
  standalone: false
})
export class AdminLandingComponent {
  navigator = window.navigator;
}
