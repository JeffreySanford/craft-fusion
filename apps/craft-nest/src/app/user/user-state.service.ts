import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * UserStateService
 * 
 * This service implements RxJS state management following Dan Wahlin's methodology:
 * - State is stored in BehaviorSubjects (creating "hot" observables)
 * - Operations that modify state update the relevant subjects
 * - Queries return observables derived from these subjects
 * - No promises are used
 * 
 * This approach ensures all state changes are immediately propagated to subscribers,
 * creating a reactive system that keeps the UI in sync with the backend state.
 */
@Injectable()
export class UserStateService {
  // BehaviorSubjects for state management
  private userLoginTimesSubject = new BehaviorSubject<Map<string, Date>>(new Map<string, Date>());
  private guestLoginTimesSubject = new BehaviorSubject<Map<string, Date>>(new Map<string, Date>());
  
  private userVisitLengthsSubject = new BehaviorSubject<Map<string, number>>(new Map<string, number>());
  private guestVisitLengthsSubject = new BehaviorSubject<Map<string, number>>(new Map<string, number>());
  
  private userVisitedPagesSubject = new BehaviorSubject<Map<string, string[]>>(new Map<string, string[]>());
  private guestVisitedPagesSubject = new BehaviorSubject<Map<string, string[]>>(new Map<string, string[]>());

  // Expose hot observables for direct subscription
  get userLoginTimes$(): Observable<Map<string, Date>> {
    return this.userLoginTimesSubject.asObservable();
  }

  get guestLoginTimes$(): Observable<Map<string, Date>> {
    return this.guestLoginTimesSubject.asObservable();
  }

  get userVisitLengths$(): Observable<Map<string, number>> {
    return this.userVisitLengthsSubject.asObservable();
  }

  get guestVisitLengths$(): Observable<Map<string, number>> {
    return this.guestVisitLengthsSubject.asObservable();
  }

  get userVisitedPages$(): Observable<Map<string, string[]>> {
    return this.userVisitedPagesSubject.asObservable();
  }

  get guestVisitedPages$(): Observable<Map<string, string[]>> {
    return this.guestVisitedPagesSubject.asObservable();
  }

  setLoginDateTime(dateTime: Date, userId: string, isGuest = false): Observable<void> {
    if (isGuest) {
      const currentMap = this.guestLoginTimesSubject.value;
      const updatedMap = new Map(currentMap);
      updatedMap.set(userId, dateTime);
      this.guestLoginTimesSubject.next(updatedMap);
    } else {
      const currentMap = this.userLoginTimesSubject.value;
      const updatedMap = new Map(currentMap);
      updatedMap.set(userId, dateTime);
      this.userLoginTimesSubject.next(updatedMap);
    }
    
    // Return an Observable that completes immediately
    return of(undefined);
  }

  getLoginDateTime(userId: string, isGuest = false): Observable<Date | null> {
    // Return an observable that maps the current state to the requested value
    if (isGuest) {
      return this.guestLoginTimes$.pipe(
        map(map => map.get(userId) || null)
      );
    } else {
      return this.userLoginTimes$.pipe(
        map(map => map.get(userId) || null)
      );
    }
  }

  setVisitLength(length: number, userId: string, isGuest = false): Observable<void> {
    if (isGuest) {
      const currentMap = this.guestVisitLengthsSubject.value;
      const updatedMap = new Map(currentMap);
      updatedMap.set(userId, length);
      this.guestVisitLengthsSubject.next(updatedMap);
    } else {
      const currentMap = this.userVisitLengthsSubject.value;
      const updatedMap = new Map(currentMap);
      updatedMap.set(userId, length);
      this.userVisitLengthsSubject.next(updatedMap);
    }
    
    return of(undefined);
  }

  getVisitLength(userId: string, isGuest = false): Observable<number | null> {
    if (isGuest) {
      return this.guestVisitLengths$.pipe(
        map(map => map.get(userId) || null)
      );
    } else {
      return this.userVisitLengths$.pipe(
        map(map => map.get(userId) || null)
      );
    }
  }

  setVisitedPage(page: string, userId: string, isGuest = false): Observable<void> {
    if (isGuest) {
      return this.updateVisitedPagesMap(
        this.guestVisitedPagesSubject, 
        userId, 
        page
      );
    } else {
      return this.updateVisitedPagesMap(
        this.userVisitedPagesSubject, 
        userId, 
        page
      );
    }
  }

  getVisitedPages(userId: string, isGuest = false): Observable<string[]> {
    if (isGuest) {
      return this.guestVisitedPages$.pipe(
        map(map => map.get(userId) || [])
      );
    } else {
      return this.userVisitedPages$.pipe(
        map(map => map.get(userId) || [])
      );
    }
  }

  /**
   * Helper method to update a visited pages map
   */
  private updateVisitedPagesMap(
    subject: BehaviorSubject<Map<string, string[]>>, 
    userId: string, 
    page: string
  ): Observable<void> {
    const currentMap = subject.value;
    const updatedMap = new Map(currentMap);
    
    const pages = updatedMap.get(userId) || [];
    if (!pages.includes(page)) {
      pages.push(page);
    }
    
    updatedMap.set(userId, pages);
    subject.next(updatedMap);
    
    return of(undefined);
  }
}
