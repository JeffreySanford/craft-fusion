import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class AdminStateService {
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  constructor(private logger: LoggerService) {
    this.logger.registerService('AdminStateService');
    console.log('AdminStateService initialized', { initialValue: false });
  }

  setAdminStatus(isAdmin: boolean): void {
    const callId = this.logger.startServiceCall('AdminStateService', 'SET', '/admin/status');
    console.log('AdminStateService: Setting admin status to', isAdmin);
    this.isAdminSubject.next(isAdmin);
    this.logger.endServiceCall(callId, 200);
  }

  getAdminStatus(): boolean {
    const callId = this.logger.startServiceCall('AdminStateService', 'GET', '/admin/status');
    const value = this.isAdminSubject.getValue();
    console.log('AdminStateService: Current admin status is', value);
    this.logger.endServiceCall(callId, 200);
    return value;
  }
}
