import { Controller, Get } from '@nestjs/common';
import { OpenSkyService } from './opensky.service';
import { Observable } from 'rxjs';
import { Flight } from './opensky.service';

@Controller('opensky')
export class OpenSkyController {
  constructor(private openSkyService: OpenSkyService) {}
  
  @Get('flightParams')
  getFlightParams(descriptor: any): Observable<Flight[]> {
    console.log(descriptor);
    return this.openSkyService.fetchFlightData();
  }

}