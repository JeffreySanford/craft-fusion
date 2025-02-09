import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
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
  saveVisitLength(@Body() body: { length: number }): Observable<void> {
    const length = body.length;
    console.log('STATE: Saving visit length:', length);
    if (length === null || length === undefined || isNaN(length)) {
      throw new HttpException('Invalid visit length', HttpStatus.BAD_REQUEST);
    }
    return this.userStateService.setVisitLength(length);
  }

  @Get('getVisitLength')
  getVisitLength(): Observable<number | null> {
    console.log('STATE: Fetching visit length');
    return this.userStateService.getVisitLength();
  }

  @Post('saveVisitedPages')
  saveVisitedPages(@Body() pages: string[]): Observable<void> {
    console.log('STATE: Saving visited pages:', pages);
    if (!Array.isArray(pages)) {
      throw new HttpException('Invalid pages format', HttpStatus.BAD_REQUEST);
    }
    return this.userStateService.setVisitedPages(pages);
  }

  @Get('getVisitedPages')
  getVisitedPages(): Observable<string[]> {
    console.log('STATE: Fetching visited pages');
    return this.userStateService.getVisitedPages();
  }
}
