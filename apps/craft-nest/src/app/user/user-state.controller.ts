import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UserStateService } from './user-state.service';
import { Observable } from 'rxjs';

@Controller('user')
export class UserStateController {
  constructor(private readonly userStateService: UserStateService) {}

  @Post('saveLoginDateTime')
  saveLoginDateTime(@Body() body: { dateTime: string }): Observable<void> {
    const dateTime = new Date(body.dateTime);
    console.log('STATE: Saving login date/time:', dateTime);
    if (isNaN(dateTime.getTime())) {
      throw new HttpException('Invalid date/time', HttpStatus.BAD_REQUEST);
    }
    return this.userStateService.setLoginDateTime(dateTime);
  }

  @Get('getLoginDateTime')
  getLoginDateTime(): Observable<Date | null> {
    console.log('STATE: Fetching login date/time');
    return this.userStateService.getLoginDateTime();
  }

  @Post('saveVisitLength')
  saveVisitLength(): Observable<void> {
    console.log('STATE: Saving visit length');
    return this.userStateService.setVisitLength();
  }

  @Get('getVisitLength')
  getVisitLength(): Observable<number | null> {
    console.log('STATE: Fetching visit length');
    return this.userStateService.getVisitLength();
  }

  @Post('saveVisitedPage/:page')
  saveVisitedPage(@Param('page') page: string): Observable<void> {
    console.log('STATE: Saving visited page:', page);
    if (!page) {
      throw new HttpException('Page name is required', HttpStatus.BAD_REQUEST);
    }
    return this.userStateService.setVisitedPage(page);
  }

  @Get('getVisitedPages')
  getVisitedPages(): Observable<string[]> {
    console.log('STATE: Fetching visited pages');
    return this.userStateService.getVisitedPages();
  }
}
