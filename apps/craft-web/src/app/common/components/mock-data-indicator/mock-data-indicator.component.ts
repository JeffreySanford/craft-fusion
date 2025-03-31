import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-mock-data-indicator',
  templateUrl: './mock-data-indicator.component.html',
  styleUrls: ['./mock-data-indicator.component.scss'],
  standalone: false,
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(-10px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition(':enter', animate('200ms ease-out')),
      transition(':leave', animate('200ms ease-in'))
    ]),
    trigger('pulse', [
      state('inactive', style({ transform: 'scale(1)' })),
      state('active', style({ transform: 'scale(1.1)' })),
      transition('inactive <=> active', animate('500ms ease-in-out'))
    ])
  ]
})
export class MockDataIndicatorComponent implements OnInit {
  @Input() showDetails: boolean = false;
  @Input() source: string = 'Local Mock';
  @Input() dataType: string = 'Sample Data';
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right';
  @Input() transparent: boolean = false;

  timeGenerated: Date = new Date();
  pulseState: 'active' | 'inactive' = 'inactive';
  detailsVisible = false;
  
  constructor() { }

  ngOnInit(): void {
    // Start the pulse animation
    this.startPulseAnimation();
  }

  private startPulseAnimation(): void {
    setInterval(() => {
      this.pulseState = this.pulseState === 'inactive' ? 'active' : 'inactive';
    }, 3000);
  }

  toggleDetails(): void {
    this.detailsVisible = !this.detailsVisible;
  }
}
