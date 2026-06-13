// ...existing code...
import { Controller, Get, Param, Query } from '@nestjs/common';
import { OpenSkyService } from './opensky.service';
import { Observable } from 'rxjs';
import { Flight } from './opensky.service';

@Controller('opensky')
export class OpenSkyController {
  constructor(private openSkyService: OpenSkyService) {}
  
  @Get('flightParams')
  getFlightData(): Observable<Flight[]> {
    return this.openSkyService.fetchFlightData();
  }

  @Get('fetchflightdata')
  fetchFlightData(): Observable<Flight[]> {
    return this.openSkyService.fetchFlightData();
  }

  @Get('airports')
  getAirportData(): Observable<any> {
    return this.openSkyService.fetchAirportData();
  }

  @Get('flights/airline/:airline')
  getFlightDataByAirline(@Param('airline') airline: string): Observable<Flight[]> {
    return this.openSkyService.fetchFlightDataByAirline(airline);
  }

  @Get('flights/aircraft/:aircraft')
  getFlightDataByAircraft(@Param('aircraft') aircraft: string): Observable<Flight[]> {
    return this.openSkyService.fetchFlightDataByAircraft(aircraft);
  }
  @Get('nearby')
  getNearbyFlights(
    @Query('lamin') lamin: number,
    @Query('lomin') lomin: number,
    @Query('lamax') lamax: number,
    @Query('lomax') lomax: number,
  ) {
    return this.openSkyService.fetchFlightsInBoundingBox(Number(lamin), Number(lomin), Number(lamax), Number(lomax));
  }
}