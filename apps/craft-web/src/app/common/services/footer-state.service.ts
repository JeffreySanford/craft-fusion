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

  /**
   * Get the current footer expansion state
   * @returns - Current expansion state
   */
  getExpanded(): boolean {
    
    return this.expandedSubject.getValue();
  }

  /**
   * Toggle the footer expansion state
   */
  toggleExpanded(): void {
    this.expandedSubject.next(!this.expandedSubject.getValue());
  }

  isCollapsed$(): boolean {
    return !this.expandedSubject.getValue();
  }

  setCollapsed(collapsed: boolean): void {
    this.expandedSubject.next(!collapsed);
  }
  
  isExpanded$(): boolean {
    return this.expandedSubject.getValue();
  }
}
