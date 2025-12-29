import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { UserStateService } from './user-state.service';
import { Observable } from 'rxjs';

// Create RequestWithUser interface definition
interface RequestWithUser {
  user?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * UserStateController
 * 
 * This controller implements RxJS Hot Observable streams for state management
 * following Dan Wahlin's RXJS State methodology.
 * 
 * Key concepts:
 * - All methods return hot observables (shared data streams)
 * - State is maintained in the service using BehaviorSubjects
 * - Frontend can subscribe to these streams for real-time updates
 * - No promises are used anywhere in the implementation
 * 
 * Integration with frontend:
 * Frontend components can subscribe to these streams to receive
 * real-time updates when state changes, creating a reactive experience.
 * The subscription pattern should be:
 * 
 * ```typescript
 * // Angular component example
 * this.userStateService.visitedPages$.subscribe(pages => {
 *   this.pages = pages;
 * });
 * ```
 */
@Controller('user')
export class UserStateController {
  constructor(private readonly userStateService: UserStateService) {}

  @Post('saveLoginDateTime')
  saveLoginDateTime(@Body() body: { dateTime: string }, @Req() request: RequestWithUser): Observable<void> {
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    const dateTime = new Date(body.dateTime);
    
    // Directly return the observable from the service
    return this.userStateService.setLoginDateTime(dateTime, userId, isGuest);
  }

  @Get('getLoginDateTime')
  getLoginDateTime(@Req() request: RequestWithUser): Observable<Date | null> {
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    
    // Return the hot observable from the service
    return this.userStateService.getLoginDateTime(userId, isGuest);
  }

  @Post('saveVisitLength')
  saveVisitLength(@Body() body: { length: number }, @Req() request: RequestWithUser): Observable<void> {
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    
    // Directly return the observable from the service
    return this.userStateService.setVisitLength(body.length, userId, isGuest);
  }

  @Get('getVisitLength')
  getVisitLength(@Req() request: RequestWithUser): Observable<number | null> {
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    
    // Return the hot observable from the service
    return this.userStateService.getVisitLength(userId, isGuest);
  }

  @Post('saveVisitedPage/:page')
  saveVisitedPage(@Param('page') page: string, @Req() request: RequestWithUser): Observable<void> {
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    
    // Directly return the observable from the service
    return this.userStateService.setVisitedPage(page, userId, isGuest);
  }

  @Get('getVisitedPages')
  getVisitedPages(@Req() request: RequestWithUser): Observable<string[]> {
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    
    // Return the hot observable from the service
    return this.userStateService.getVisitedPages(userId, isGuest);
  }
}
