import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private isCollapsedSource = new BehaviorSubject<boolean>(false);
  isCollapsed$: Observable<boolean> = this.isCollapsedSource.asObservable();

  constructor() {}

  toggleSidebar(isCollapsed: boolean): void {
    this.isCollapsedSource.next(isCollapsed);
  }

  getSidebarState(): boolean {
    return this.isCollapsedSource.getValue();
  }
}
