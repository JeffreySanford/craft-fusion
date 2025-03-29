import { Component } from '@angular/core';
import { LoggerService } from '../../common/services/logger.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: false
})
export class LandingComponent {
  items = ['Architect', 'Developer', 'Designer'];

  constructor(private logger: LoggerService) { }

  ngOnInit() {
    this.logger.info('Landing component initialized');
    this.logger.debug('Landing setup complete');
  }
}
