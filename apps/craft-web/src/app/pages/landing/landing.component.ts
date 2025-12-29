import { Component, Inject, OnInit } from '@angular/core';
import { LoggerService } from '@craft-web/services/logger.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: false
})
export class LandingComponent implements OnInit {
  items = ['Architect', 'Developer', 'Designer'];
  
  constructor(private logger: LoggerService) {

  }

  ngOnInit(): void {
    this.logger.info('LandingComponent', 'LandingComponent initialized');
  }
}
