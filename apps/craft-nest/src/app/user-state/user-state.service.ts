import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class UserStateService {
  // Store user state in memory with separate collections for guests and authenticated users
  private userLoginTimes = new Map<string, Date>();
  private guestLoginTimes = new Map<string, Date>();
  
  private userVisitLengths = new Map<string, number>();
  private guestVisitLengths = new Map<string, number>();
  
  private userVisitedPages = new Map<string, string[]>();
  private guestVisitedPages = new Map<string, string[]>();

  constructor(private socketGateway: SocketGateway) {}

  setLoginDateTime(dateTime: Date, userId: string, isGuest = false): Observable<void> {
    if (isGuest) {
      this.guestLoginTimes.set(userId, dateTime);
    } else {
      this.userLoginTimes.set(userId, dateTime);
    }

    // Broadcast change via socket if applicable
    this.socketGateway.broadcastStateChange({
      userId,
      type: 'loginDateTimeUpdated',
      data: { dateTime }
    });

    return of(undefined);
  }

  getLoginDateTime(userId: string, isGuest = false): Observable<Date | null> {
    let dateTime: Date | undefined;
    
    if (isGuest) {
      dateTime = this.guestLoginTimes.get(userId);
    } else {
      dateTime = this.userLoginTimes.get(userId);
    }
    
    return of(dateTime || null);
  }

  setVisitLength(length: number, userId: string, isGuest = false): Observable<void> {
    if (isGuest) {
      this.guestVisitLengths.set(userId, length);
    } else {
      this.userVisitLengths.set(userId, length);
    }

    // Broadcast change via socket if applicable
    this.socketGateway.broadcastStateChange({
      userId,
      type: 'visitLengthUpdated',
      data: { length }
    });

    return of(undefined);
  }

  getVisitLength(userId: string, isGuest = false): Observable<number | null> {
    let length: number | undefined;
    
    if (isGuest) {
      length = this.guestVisitLengths.get(userId);
    } else {
      length = this.userVisitLengths.get(userId);
    }
    
    return of(length || null);
  }

  addVisitedPage(page: string, userId: string, isGuest = false): Observable<void> {
    let pages: string[];
    
    if (isGuest) {
      pages = this.guestVisitedPages.get(userId) || [];
      if (!pages.includes(page)) {
        pages.push(page);
      }
      this.guestVisitedPages.set(userId, pages);
    } else {
      pages = this.userVisitedPages.get(userId) || [];
      if (!pages.includes(page)) {
        pages.push(page);
      }
      this.userVisitedPages.set(userId, pages);
    }

    // Broadcast change via socket if applicable
    this.socketGateway.broadcastStateChange({
      userId,
      type: 'visitedPagesUpdated',
      data: { pages }
    });

    return of(undefined);
  }

  getVisitedPages(userId: string, isGuest = false): Observable<string[]> {
    let pages: string[];
    
    if (isGuest) {
      pages = this.guestVisitedPages.get(userId) || [];
    } else {
      pages = this.userVisitedPages.get(userId) || [];
    }
    
    return of(pages);
  }
}
