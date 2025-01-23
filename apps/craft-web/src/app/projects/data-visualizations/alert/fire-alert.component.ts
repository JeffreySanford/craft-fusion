import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { MapboxService } from '../../../common/services/mapbox.service';
import { FlightRadarService } from '../../../common/services/flightradar.service';
import { FlightAwareService } from '../../../common/services/flightaware.service';
import { identity } from 'rxjs';

@Component({
  selector: 'app-fire-alert',
  templateUrl: './fire-alert.component.html',
  styleUrls: ['./fire-alert.component.scss'],
  standalone: false,
})
export class FireAlertComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() alerts: any[] = [];

  fr24Flights: any[] = [];
  legendItems: string[] = ['High Priority', 'Medium Priority', 'Low Priority'];

  cityCoordinates: { [key: string]: [number, number] } = {
    'Los Angeles': [-118.2437, 34.0522],
    'New York': [-74.006, 40.7128],
    'Chicago': [-87.6298, 41.8781],
    'Las Vegas': [-115.1398, 36.1699],
    'San Francisco': [-122.4194, 37.7749]
  };

  flights: any[] = [];

  cities = [
    {
      name: 'Los Angeles',
      coords: { lat: 34.0522, lng: -118.2437 },
      alerts: [
        { id: 1, name: 'Alert 1', time: '2023-10-01T10:00:00Z' },
        { id: 2, name: 'Alert 2', time: '2023-10-01T12:00:00Z' }
      ]
    },
    {
      name: 'New York',
      coords: { lat: 40.7128, lng: -74.0060 },
      alerts: [
        { id: 3, name: 'Alert 3', time: '2023-10-02T14:00:00Z' },
        { id: 4, name: 'Alert 4', time: '2023-10-02T16:00:00Z' }
      ]
    },
    {
      name: 'Chicago',
      coords: { lat: 41.8781, lng: -87.6298 },
      alerts: [
        { id: 5, name: 'Alert 5', time: '2023-10-03T18:00:00Z' },
        { id: 6, name: 'Alert 6', time: '2023-10-03T20:00:00Z' }
      ]
    }
  ];

  constructor(private mapboxService: MapboxService, private flightRadarService: FlightRadarService, private flightAwareService: FlightAwareService) {
    console.log('STEP 1: FireAlertComponent initialized');
  }

  ngOnInit(): void {
    console.log('STEP 2: ngOnInit called');
  }

  ngAfterViewInit(): void {
    console.log('STEP 3: ngAfterViewInit called');
    this.initializeMap(this.cities[0].name, this.cities[0].alerts[0].id); // Initialize the first tab by default
    this.fetchFlightData();
  }

  initializeMap(city: string, alertId: number): void {
    console.log('STEP 4: Initializing map for city', city);
    const coordinates = this.cityCoordinates[city] || [-118.2437, 34.0522]; // Default to Los Angeles if city not found
    const map = this.mapboxService.initializeMap(`map-${alertId}`, coordinates, 12);

    debugger
    map.on('load', () => {
      console.log(`Map for alert ${alertId} in ${city} loaded`);
    });

    map.on('click', event => {
      const coords = event.lngLat;
      const alertMessage = `Alert triggered at [${coords.lng}, ${coords.lat}]`;
      this.alerts.push(alertMessage);
      this.mapboxService.addMarker([coords.lng, coords.lat], alertMessage);
      console.log('STEP 5: Map clicked, alert triggered', alertMessage);
    });
  }

  onTabChange(event: any): void {
    const city = this.cities[event.index];
    this.initializeMap(city.name, city.alerts[0].id);
  }

  fetchFlightData(): void {
    console.log('STEP 6: Fetching flight data');
    // Example bounding box coordinates for Los Angeles area
    const lat1 = 33.5;
    const lon1 = -118.5;
    const lat2 = 34.5;
    const lon2 = -117.5;

    // const aircraftType = 'Boeing 737'; // Example aircraft type
    // this.flightAwareService.getFlightsByAircraftType(aircraftType).subscribe(
    //   (data) => {
    //     console.log('STEP 7: Flight data fetched', data);
    //     this.flights = data.flights; // Store flight data
    //     // Process and display flight data on the map
    //     data.flights.forEach((flight: any) => {
    //       const coordinates: [number, number] = [flight.longitude, flight.latitude];
    //       this.mapboxService.addMarker(coordinates, `Flight: ${flight.ident}`);
    //       console.log('STEP 8: Flight marker added', flight);
    //     });
    //   },
    //   (error) => {
    //     console.error('STEP 9: Error fetching flight data', error);
    //     alert('Failed to fetch flight data. Please check your API key and network connection.');
    //   }
    // );

    this.flightRadarService.getFlightsByBoundingBox(lat1, lon1, lat2, lon2).subscribe(
      data => {
        console.log('STEP 7: Flight data fetched', data);
        // Process and display flight data on the map
        this.fr24Flights = data.data;

        this.fr24Flights.forEach((flight: any) => {
          // for each flight, look up the information for the flight and include it on the addMarker report
          const coordinates: [number, number] = [flight.lon, flight.lat];

          this.flightRadarService.getFlightById(flight.fr24_id).subscribe(
            next => {
              console.log('STEP 7.1: Flight data fetched', next);
              // Process and display flight data on the map
              const flightData = next[0];

              const flight = {
                flight: flightData.flight,
                aircraft: { type: '', registration: '' },
                origin: '',
                destination: '',
                altitude: 0,
                speed: 0,
                identity: flightData.ident,
                r24_id: flightData.r24_id,
                tracks: flightData.tracks,
              };

              flight.aircraft.type = flightData.aircraft.type;
              flight.aircraft.registration = flightData.aircraft.registration;
              flight.origin = flightData.origin;
              flight.destination = flightData.destination;
              flight.altitude = flightData.altitude;
              flight.speed = flightData.speed;

              // Add marker for the flight
              this.mapboxService.addMarker(coordinates, `Flight: ${flight.flight} - ${flight.origin} to ${flight.destination} - ${flight.aircraft.type}`);

              // Draw lines for the tracks points
              if (flight.tracks && flight.tracks.length > 1) {
                const trackCoordinates = flight.tracks.map((track: any) => [track.lon, track.lat]);
                this.mapboxService.addPolyline(trackCoordinates);
              }
              this.mapboxService.addMarker(coordinates, `Flight: ${flight.flight} - ${flight.origin} to ${flight.destination} - ${flight.aircraft.type}`);
            },
            error => {
              if (error.status === 404) {
                console.warn('STEP 7.2: Flight not found', flight.flight);
              } else {
                console.error('STEP 7.2: Error fetching flight data', error);
              }
            },
            () => {
              console.log('STEP 7.3: Flight data fetched', flight);
            },
          );
        });
      },
      error => {
        console.error('STEP 9: Error fetching flight data', error);
        alert('Failed to fetch flight data. Please check your API key and network connection.');
      },
    );
  }

  // Focus on a specific alert
  focusAlert(alert: any): void {
    console.log('STEP 10: Focused alert', alert);
    // Add logic for focusing/handling the alert
  }

  ngOnDestroy(): void {
    console.log('STEP 11: ngOnDestroy called');
    this.mapboxService.destroyMap();
  }
}
