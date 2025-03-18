import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FooterStateService {
  private expandedSubject = new BehaviorSubject<boolean>(false);
  
  // Observable that components can subscribe to
  public expanded$: Observable<boolean> = this.expandedSubject.asObservable();
  
  /**
   * Update the footer expansion state
   * @param expanded - Whether the footer is expanded
   */
  setExpanded(expanded: boolean): void {
    this.expandedSubject.next(expanded);
  }
}
