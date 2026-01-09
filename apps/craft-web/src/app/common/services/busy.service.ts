import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable()
export class BusyService {
  constructor(private logger: LoggerService) {
    this.logger.registerService('BusyService');
  }

  increment(msg: string) {
    const callId = this.logger.startServiceCall('BusyService', 'INCREMENT', '/busy/increment');
    console.log(msg);
    this.logger.endServiceCall(callId, 200);
  }

  decrement() {
    const callId = this.logger.startServiceCall('BusyService', 'DECREMENT', '/busy/decrement');
    console.log('Busy cleared');
    this.logger.endServiceCall(callId, 200);
  }
}
