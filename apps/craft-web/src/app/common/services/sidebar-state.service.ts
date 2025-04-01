import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private isCollapsedSource = new BehaviorSubject<boolean>(false);
  isCollapsed$: Observable<boolean> = this.isCollapsedSource.asObservable();
  
  private isExpandedSource = new BehaviorSubject<boolean>(false);
  expanded$: Observable<boolean> = this.isExpandedSource.asObservable();

  constructor() { }

  setCollapsed(collapsed: boolean): void {
    this.isCollapsedSource.next(collapsed);
  }

  toggleCollapsed(): void {
    this.isCollapsedSource.next(!this.isCollapsedSource.getValue());
  }

  setExpanded(expanded: boolean): void {
    this.isExpandedSource.next(expanded);
  }

  toggleExpanded(): void {
    this.isExpandedSource.next(!this.isExpandedSource.getValue());
  }

  getCollapsedState(): boolean {
    return this.isCollapsedSource.getValue();
  }

  getExpandedState(): boolean {
    return this.isExpandedSource.getValue();
  }
}
