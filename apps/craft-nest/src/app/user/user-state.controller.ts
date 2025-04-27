import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserStateService } from './user-state.service';
import { Observable } from 'rxjs';

// Define interface that extends Request to include user property
interface RequestWithUser extends Request {
  user?: {
    id: string;
    // Add other user properties as needed
  };
}

@Controller('user')
export class UserStateController {
  constructor(private readonly userStateService: UserStateService) {}

  @Post('saveLoginDateTime')
  saveLoginDateTime(@Body() body: { dateTime: string }, @Req() request: RequestWithUser): Observable<void> {
    const dateTime = new Date(body.dateTime);
    console.log(`STATE: Saving login date/time for user:`, dateTime);
    
    if (isNaN(dateTime.getTime())) {
      throw new Error('Invalid date/time');
    }
    
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.setLoginDateTime(dateTime, userId, isGuest);
  }

  @Get('getLoginDateTime')
  getLoginDateTime(@Req() request: RequestWithUser): Observable<Date | null> {
    console.log(`STATE: Fetching login date/time`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.getLoginDateTime(userId, isGuest);
  }

  @Post('saveVisitLength')
  saveVisitLength(@Body() body: { length: number }, @Req() request: RequestWithUser): Observable<void> {
    console.log(`STATE: Saving visit length`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.setVisitLength(body.length, userId, isGuest);
  }

  @Get('getVisitLength')
  getVisitLength(@Req() request: RequestWithUser): Observable<number | null> {
    console.log(`STATE: Fetching visit length`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.getVisitLength(userId, isGuest);
  }

  @Post('saveVisitedPage/:page')
  saveVisitedPage(@Param('page') page: string, @Req() request: RequestWithUser): Observable<void> {
    console.log(`STATE: Saving visited page: ${page}`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.setVisitedPage(page, userId, isGuest);
  }

  @Get('getVisitedPages')
  getVisitedPages(@Req() request: RequestWithUser): Observable<string[]> {
    console.log(`STATE: Fetching visited pages`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.getVisitedPages(userId, isGuest);
  }
}
