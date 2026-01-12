import { Controller, Get, Post, Body, Req, Param, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserStateService } from './user-state.service';

// Define a type for the request with user info
interface RequestWithUser {
  user?: {
    id: string;
  };
}

@Controller('user')
export class UserStateController {
  private readonly logger = new Logger('UserStateController');

  constructor(private readonly userStateService: UserStateService) {}

  @Post('saveLoginDateTime')
  saveLoginDateTime(@Body() body: { dateTime: string }, @Req() request: RequestWithUser): Observable<void> {
    this.logger.verbose(`STATE: Saving login date/time`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.setLoginDateTime(new Date(body.dateTime), userId, isGuest);
  }

  @Get('getLoginDateTime')
  getLoginDateTime(@Req() request: RequestWithUser): Observable<Date | null> {
    this.logger.verbose(`STATE: Fetching login date/time`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.getLoginDateTime(userId, isGuest);
  }

  @Post('saveVisitLength')
  saveVisitLength(@Body() body: { length: number }, @Req() request: RequestWithUser): Observable<void> {
    this.logger.verbose(`STATE: Saving visit length`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.setVisitLength(body.length, userId, isGuest);
  }

  @Get('getVisitLength')
  getVisitLength(@Req() request: RequestWithUser): Observable<number | null> {
    this.logger.verbose(`STATE: Fetching visit length`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.getVisitLength(userId, isGuest);
  }

  @Post('saveVisitedPage/:page')
  saveVisitedPage(@Param('page') page: string, @Req() request: RequestWithUser): Observable<void> {
    this.logger.verbose(`STATE: Saving visited page ${page}`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.addVisitedPage(page, userId, isGuest);
  }

  @Get('getVisitedPages')
  getVisitedPages(@Req() request: RequestWithUser): Observable<string[]> {
    this.logger.verbose(`STATE: Fetching visited pages`);
    const userId = request.user?.id || 'guest';
    const isGuest = !request.user;
    return this.userStateService.getVisitedPages(userId, isGuest);
  }
}
