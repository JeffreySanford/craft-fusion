import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FooterStateService {
  private expandedSubject = new BehaviorSubject<boolean>(false);

  public expanded$: Observable<boolean> = this.expandedSubject.asObservable();

  setExpanded(expanded: boolean): void {
    console.log('Setting footer expanded state:', expanded);             
    this.expandedSubject.next(expanded);
  }

  isExpanded(): boolean {
    return this.expandedSubject.getValue();
  }

  toggleExpanded(): void {
    const currentState = this.expandedSubject.getValue();
    console.log('Toggling footer state from:', currentState, 'to:', !currentState);             
    this.expandedSubject.next(!currentState);
  }
}
