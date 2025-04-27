import { Injectable } from '@nestjs/common';
import { Observable, BehaviorSubject } from 'rxjs';
import { mapTo } from 'rxjs/operators';
import { FileService } from '../documents/file.service';

@Injectable()
export class UserStateService {
  // Use BehaviorSubjects for hot observable state
  private userLoginTimes = new Map<string, BehaviorSubject<Date | null>>();
  private guestLoginTimes = new Map<string, BehaviorSubject<Date | null>>();

  private userVisitLengths = new Map<string, BehaviorSubject<number | null>>();
  private guestVisitLengths = new Map<string, BehaviorSubject<number | null>>();

  private userVisitedPages = new Map<string, BehaviorSubject<string[]>>();
  private guestVisitedPages = new Map<string, BehaviorSubject<string[]>>();

  constructor(private fileService: FileService) {}

  private getOrCreateSubject<T>(
    map: Map<string, BehaviorSubject<T>>,
    userId: string,
    initial: T
  ): BehaviorSubject<T> {
    if (!map.has(userId)) {
      map.set(userId, new BehaviorSubject<T>(initial));
    }
    return map.get(userId)!;
  }

  setLoginDateTime(dateTime: Date, userId: string, isGuest = false): Observable<void> {
    const map = isGuest ? this.guestLoginTimes : this.userLoginTimes;
    this.getOrCreateSubject(map, userId, null).next(dateTime);
    if (!isGuest) {
      this.fileService.saveOpenedDocuments([`loginDateTime:${userId}`, dateTime.toISOString()]).subscribe();
    }
    return this.getOrCreateSubject(map, userId, null).asObservable().pipe(mapTo(void 0));
  }

  getLoginDateTime(userId: string, isGuest = false): Observable<Date | null> {
    const map = isGuest ? this.guestLoginTimes : this.userLoginTimes;
    return this.getOrCreateSubject(map, userId, null).asObservable();
  }

  setVisitLength(length: number, userId: string, isGuest = false): Observable<void> {
    const map = isGuest ? this.guestVisitLengths : this.userVisitLengths;
    this.getOrCreateSubject(map, userId, null).next(length);
    if (!isGuest) {
      this.fileService.saveOpenedDocuments([`visitLength:${userId}`, length.toString()]).subscribe();
    }
    return this.getOrCreateSubject(map, userId, null).asObservable().pipe(mapTo(void 0));
  }

  getVisitLength(userId: string, isGuest = false): Observable<number | null> {
    const map = isGuest ? this.guestVisitLengths : this.userVisitLengths;
    return this.getOrCreateSubject(map, userId, null).asObservable();
  }

  setVisitedPage(page: string, userId: string, isGuest = false): Observable<void> {
    const map = isGuest ? this.guestVisitedPages : this.userVisitedPages;
    const subject = this.getOrCreateSubject(map, userId, []);
    const pages = subject.value;
    if (!pages.includes(page)) {
      subject.next([...pages, page]);
      if (!isGuest) {
        this.fileService.saveOpenedDocuments([`visitedPages:${userId}`, JSON.stringify([...pages, page])]).subscribe();
      }
    }
    return subject.asObservable().pipe(mapTo(void 0));
  }

  getVisitedPages(userId: string, isGuest = false): Observable<string[]> {
    const map = isGuest ? this.guestVisitedPages : this.userVisitedPages;
    return this.getOrCreateSubject(map, userId, []).asObservable();
  }
}
