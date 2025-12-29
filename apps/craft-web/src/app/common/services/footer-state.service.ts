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
    console.log('Setting footer expanded state:', expanded); // Debug log
    this.expandedSubject.next(expanded);
  }
  
  /**
   * Get the current footer expansion state
   * @returns boolean
   */
  isExpanded(): boolean {
    return this.expandedSubject.getValue();
  }
  
  /**
   * Toggle the footer expansion state
   */
  toggleExpanded(): void {
    const currentState = this.expandedSubject.getValue();
    console.log('Toggling footer state from:', currentState, 'to:', !currentState); // Debug log
    this.expandedSubject.next(!currentState);
  }
}
