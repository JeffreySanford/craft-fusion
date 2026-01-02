import { Component, OnInit, OnDestroy, AfterViewInit, Input, HostBinding, SimpleChanges } from '@angular/core';
import { MapboxService } from '../../../common/services/mapbox.service';
import { OpenSkiesService, OpenSkyFlight } from '../../../common/services/openskies.service';
import { NasaFirmsService, NasaFirmsAlert } from '../../../common/services/nasa-firms.service';
import { interval, Subscription } from 'rxjs';
import moment from 'moment-timezone';

interface City {
  name: string;
  state: string;
  coords: { lat: number; lng: number };
  mapId: string;
  alerts: FireAlert[];
  timezoneOffset: number;
  timezone: string;
  radiusKm?: number;
}

interface FireAlert {
  id: string;
  name: string;
  time: string;
  level: string;
  latitude: number;
  longitude: number;
  confidence?: number;
  frp?: number;
}

interface FlightInfo {
  id: string;
  callSign?: string;
  altitude?: number;
  latitude?: number;
  longitude?: number;
}

@Component({
  selector: 'app-fire-alert',
  templateUrl: './fire-alert.component.html',
  styleUrls: ['./fire-alert.component.scss'],
  standalone: false,
  host: {
    class: 'grid-tile large-tile',                             
  },
})
export class FireAlertComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() alerts: FireAlert[] = [];
  @Input() width: number = 0;
  @Input() height: number = 0;
  @Input() compact: boolean = false;

  @HostBinding('class.full-height') fullHeight = true;

  flights: FlightInfo[] = [];
  currentTime!: string;
  utcTime!: string;
  timeSubscription?: Subscription;

  private lastWidth: number = 0;
  private lastHeight: number = 0;

  cities: City[] = [
    {
      name: 'Los Angeles',
      state: 'California',
      coords: { lat: 34.0522, lng: -118.2437 },
      mapId: 'los-angeles',
      alerts: [],
      timezoneOffset: -8,
      timezone: 'PDT -08:00',
      radiusKm: 150,
    },
    {
      name: 'New York',
      state: 'New York',
      coords: { lat: 40.7128, lng: -74.006 },
      mapId: 'new-york',
      alerts: [],
      timezoneOffset: -5,
      timezone: 'EDT -05:00',
      radiusKm: 120,
    },
    {
      name: 'Chicago',
      state: 'Illinois',
      coords: { lat: 41.8781, lng: -87.6298 },
      mapId: 'chicago',
      alerts: [],
      timezoneOffset: -6,
      timezone: 'CDT -06:00',
      radiusKm: 120,
    },
  ];
  selectedCity!: City;                           
  selectedPriorityLevel: string = 'All';
  private resizeHandler = this.handleResize.bind(this);

  constructor(
    private mapboxService: MapboxService,
    private openSkiesService: OpenSkiesService,
    private nasaFirmsService: NasaFirmsService,
  ) {
    console.log('STEP 1: FireAlertComponent initialized');
  }

  ngOnInit(): void {
    console.log('STEP 2: ngOnInit called');
    this.selectedCity = this.cities[0] as City;
    this.startCurrentTimeStream(this.selectedCity);
  }

  ngAfterViewInit(): void {
    console.log('STEP 3: ngAfterViewInit called');
    if (this.selectedCity) {
      setTimeout(() => {
        this.initializeMap(this.selectedCity);
        this.loadFireAlerts(this.selectedCity);
        this.fetchFlightData(this.selectedCity);
      }, 0);
    }

    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['compact'] ||
      (changes['width'] && this.lastWidth !== changes['width'].currentValue) ||
      (changes['height'] && this.lastHeight !== changes['height'].currentValue)
    ) {
      this.lastWidth = this.width;
      this.lastHeight = this.height;

      if (this.selectedCity) {
        setTimeout(() => {
          this.handleResize();
        }, 100);
      }
    }
  }

  initializeMap(city: City): void {
    console.log('STEP 4: Initializing map for city', city.name);
    const coordinates = city.coords ?? { lat: 34.0522, lng: -118.2437 };

    const mapContainer = document.getElementById(`map-${city.mapId}`);
    if (!mapContainer) {
      console.error(`Map container for city ${city.name} not found`);
      return;
    }

    this.mapboxService.destroyMap();
    this.mapboxService.clearMarkers();

    const containerHeight = mapContainer.parentElement?.clientHeight || 400;
    const statusHeight = this.compact ? 0 : 180;
    const mapHeight = Math.max(200, containerHeight - statusHeight);

    if (this.width && this.height) {
      mapContainer.style.width = `${this.width}px`;
      mapContainer.style.height = `${this.height}px`;
    } else {

      mapContainer.style.height = `${mapHeight}px`;

      mapContainer.style.width = '100%';
    }

    try {
      const map = this.mapboxService.initializeMap(`map-${city.mapId}`, [coordinates.lng, coordinates.lat], 9);
      this.startCurrentTimeStream(city);

      map.on('load', () => {
        console.log(`Map for city ${city.name} loaded`);

        setTimeout(() => {
          try {
            if (typeof this.mapboxService.resizeMap === 'function') {
              this.mapboxService.resizeMap();
            } else {

              map.resize();
            }
          } catch (e) {
            console.error('Error resizing map after load:', e);
          }
        }, 300);
      });

      map.on('click', event => {
        const coords = event.lngLat;
        const alertMessage = `Alert triggered at [${coords.lng}, ${coords.lat}]`;
        const clickAlert: FireAlert = {
          id: `${coords.lng}-${coords.lat}-${Date.now()}`,
          name: 'Manual Alert',
          time: new Date().toISOString(),
          level: 'Low Priority',
          latitude: coords.lat,
          longitude: coords.lng,
        };
        this.alerts.push(clickAlert);
        if (this.selectedCity) {
          this.selectedCity.alerts = [clickAlert, ...(this.selectedCity.alerts || [])];
        }
        this.mapboxService.addMarker([coords.lng, coords.lat], alertMessage);
        console.log('STEP 5: Map clicked, alert triggered', alertMessage);
      });
    } catch (e) {
      console.error('Error initializing map:', e);
    }
  }

  onTabChange(event: any): void {
    const city = this.cities[event.index];
    if (!city) return;

    this.selectedCity = city;

    setTimeout(() => {
      this.initializeMap(this.selectedCity);
      this.loadFireAlerts(this.selectedCity);
      this.fetchFlightData(this.selectedCity);
      this.startCurrentTimeStream(this.selectedCity);
    }, 0);

    setTimeout(() => {
      this.handleResize();
    }, 350);
  }

  fetchFlightData(city: City): void {
    console.log('STEP 6: Fetching OpenSky flight data');

    const radiusKm = city.radiusKm ?? 120;
    const bounds = this.calculateBoundingBox(city.coords.lat, city.coords.lng, radiusKm);

    this.openSkiesService.fetchFlightData().subscribe({
      next: (data: OpenSkyFlight[]) => {
        const filtered = this.filterFlightsInBounds(data, bounds);
        this.flights = filtered.slice(0, 25).map(flight => {
          const flightInfo: FlightInfo = {
            id: flight.icao24 || flight.callsign || 'unknown',
          };
          const callSign = flight.callsign?.trim();
          if (callSign) {
            flightInfo.callSign = callSign;
          }
          if (typeof flight.baro_altitude === 'number' && Number.isFinite(flight.baro_altitude)) {
            flightInfo.altitude = flight.baro_altitude;
          }
          if (typeof flight.latitude === 'number' && Number.isFinite(flight.latitude)) {
            flightInfo.latitude = flight.latitude;
          }
          if (typeof flight.longitude === 'number' && Number.isFinite(flight.longitude)) {
            flightInfo.longitude = flight.longitude;
          }
          return flightInfo;
        });

        this.mapboxService.clearFlightMarkers();
        this.flights.forEach(flight => {
          if (flight.latitude !== undefined && flight.longitude !== undefined) {
            this.mapboxService.addFlightMarker([flight.longitude, flight.latitude], `Flight ${flight.callSign || flight.id}`);
          }
        });
      },
      error: (error: unknown) => {
        console.error('Error fetching OpenSky flights', error);
        this.flights = [];
      },
    });
  }

  startCurrentTimeStream(city: City): void {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }

    const timezoneOffset = city.timezoneOffset;
    this.timeSubscription = interval(100).subscribe(() => {
      this.utcTime = moment.utc().format('HH:mm');
      this.currentTime = moment.utc().add(timezoneOffset, 'hours').format('HH:mm');
    });
  }

  getPriorityClass(item: string | number | undefined): string {
    if (typeof item === 'number') {
      if (item >= 80) return 'high';
      if (item >= 40) return 'medium';
      return 'low';
    }

    switch (item) {
      case 'High Priority':
        return 'high';
      case 'Medium Priority':
        return 'medium';
      case 'Low Priority':
        return 'low';
      default:
        return '';
    }
  }

  focusAlert(alert: FireAlert): void {
    console.log('STEP 10: Focused alert', alert);
    if (alert.latitude !== undefined && alert.longitude !== undefined) {
      this.mapboxService.flyTo([alert.longitude, alert.latitude], 10);
    }
  }

  handleResize(): void {

    if (this.selectedCity) {
      const mapContainer = document.getElementById(`map-${this.selectedCity.mapId}`);

      if (mapContainer) {

        const containerHeight = mapContainer.parentElement?.clientHeight || 400;
        const statusHeight = this.compact ? 0 : 180;                                          
        const mapHeight = Math.max(200, containerHeight - statusHeight);

        if (!this.width && !this.height) {

          mapContainer.style.height = `${mapHeight}px`;
        }
      }

      setTimeout(() => {
        try {

          if (this.mapboxService && typeof this.mapboxService.resizeMap === 'function') {
            this.mapboxService.resizeMap();
            console.log('Map resized successfully');
          } else {
            console.error('MapboxService resizeMap method not available', this.mapboxService);

            const mapElement = document.querySelector('.mapboxgl-map');
            if (mapElement && (mapElement as any)._map) {
              (mapElement as any)._map.resize();
              console.log('Map resized using fallback method');
            }
          }
        } catch (e) {
          console.error('Error resizing map:', e);
        }
      }, 200);
    }
  }

  ngOnDestroy(): void {
    console.log('STEP 11: ngOnDestroy called');
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
    this.mapboxService.destroyMap();
    window.removeEventListener('resize', this.resizeHandler);
  }

  filteredAlerts(city: City): FireAlert[] {
    if (!city.alerts) return [];

    if (this.selectedPriorityLevel === 'All') {
      return city.alerts;
    }

    return city.alerts.filter(alert => alert.level === this.selectedPriorityLevel);
  }

  private loadFireAlerts(city: City): void {
    this.nasaFirmsService
      .getActiveFires({
        lat: city.coords.lat,
        lng: city.coords.lng,
        radiusKm: city.radiusKm ?? 120,
        days: 2,
        limit: 200,
      })
      .subscribe({
        next: (alerts: NasaFirmsAlert[]) => {
          city.alerts = alerts.map(alert => {
            const fireAlert: FireAlert = {
              id: alert.id,
              name: this.formatAlertName(alert),
              time: this.formatAlertTime(alert),
              level: this.mapConfidenceToLevel(alert.confidence),
              latitude: alert.latitude,
              longitude: alert.longitude,
            };
            if (typeof alert.confidence === 'number' && Number.isFinite(alert.confidence)) {
              fireAlert.confidence = alert.confidence;
            }
            if (typeof alert.frp === 'number' && Number.isFinite(alert.frp)) {
              fireAlert.frp = alert.frp;
            }
            return fireAlert;
          });

          this.mapboxService.clearMarkers();
          city.alerts.slice(0, 200).forEach(alert => {
            this.mapboxService.addMarker(
              [alert.longitude, alert.latitude],
              `${alert.name} (${alert.level})`,
            );
          });

          const bounds = this.getAlertBounds(city.alerts);
          if (bounds) {
            this.mapboxService.fitBounds(bounds, 60);
          }
        },
        error: (error: unknown) => {
          console.error('Error loading NASA FIRMS alerts', error);
          city.alerts = [];
        },
      });
  }

  private formatAlertName(alert: NasaFirmsAlert): string {
    if (alert.frp !== undefined) {
      return `Fire Radiative Power ${alert.frp.toFixed(1)}`;
    }
    if (alert.brightness !== undefined) {
      return `Thermal Anomaly ${alert.brightness.toFixed(1)}`;
    }
    return 'Fire Detection';
  }

  private formatAlertTime(alert: NasaFirmsAlert): string {
    const date = alert.acqDate ?? 'Unknown date';
    if (alert.acqTime) {
      return `${date} ${this.formatAcqTime(alert.acqTime)}`;
    }
    return date;
  }

  private formatAcqTime(value: string): string {
    const padded = value.padStart(4, '0');
    const hours = padded.slice(0, 2);
    const minutes = padded.slice(2, 4);
    return `${hours}:${minutes}`;
  }

  private mapConfidenceToLevel(confidence?: number): string {
    if (confidence === undefined) return 'Medium Priority';
    if (confidence >= 80) return 'High Priority';
    if (confidence >= 40) return 'Medium Priority';
    return 'Low Priority';
  }

  private calculateBoundingBox(lat: number, lng: number, radiusKm: number): [number, number, number, number] {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    const west = lng - lngDelta;
    const east = lng + lngDelta;
    const south = lat - latDelta;
    const north = lat + latDelta;
    return [west, south, east, north];
  }

  private filterFlightsInBounds(flights: OpenSkyFlight[], bounds: [number, number, number, number]): OpenSkyFlight[] {
    const [west, south, east, north] = bounds;
    return flights.filter(flight => {
      const lat = flight.latitude;
      const lng = flight.longitude;
      if (lat === undefined || lng === undefined) return false;
      return lat >= south && lat <= north && lng >= west && lng <= east;
    });
  }

  private getAlertBounds(alerts: FireAlert[]): [number, number, number, number] | null {
    if (!alerts.length) return null;
    const lats = alerts.map(alert => alert.latitude);
    const lngs = alerts.map(alert => alert.longitude);
    const west = Math.min(...lngs);
    const east = Math.max(...lngs);
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    return [west, south, east, north];
  }
}
