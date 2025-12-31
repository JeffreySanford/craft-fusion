import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminStateService {
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  constructor() {
    console.log('AdminStateService initialized', { initialValue: false });
  }

  setAdminStatus(isAdmin: boolean): void {
    console.log('AdminStateService: Setting admin status to', isAdmin);
    this.isAdminSubject.next(isAdmin);
  }

  getAdminStatus(): boolean {
    const value = this.isAdminSubject.getValue();
    console.log('AdminStateService: Current admin status is', value);
    return value;
  }
}
