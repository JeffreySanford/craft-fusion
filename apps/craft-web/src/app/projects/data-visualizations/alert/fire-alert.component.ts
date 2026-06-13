// ...existing imports...
// ...existing imports...
import { Component, OnInit, OnDestroy, AfterViewInit, Input, HostBinding, SimpleChanges, OnChanges } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MapboxService } from '../../../common/services/mapbox.service';
import { OpenSkyService } from './opensky.service';
import { NasaFirmsService, NasaFirmsAlert } from '../../../common/services/nasa-firms.service';
import { interval, Subscription } from 'rxjs';
import { FaaService, FaaAircraft } from '../../../common/services/faa.service';
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
export class FireAlertComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  // Collapse state for both lists
  listsCollapsed: boolean = false;

  // Toggle to show all flights (including commercial)
  showAllFlights: boolean = false;

  // Selected aircraft for highlighting
  selectedAircraft: FlightInfo | null = null;

  /**
   * Select an aircraft from the list and optionally highlight on the map
   */
  selectAircraft(flight: FlightInfo): void {
    this.selectedAircraft = flight;
    // Optionally, highlight on map (if supported)
    if (flight.latitude !== undefined && flight.longitude !== undefined) {
      this.mapboxService.flyTo([flight.longitude, flight.latitude], 12);
      // Only call highlightFlightMarker if it exists on the service
      const svc = this.mapboxService as any;
      if (typeof svc.highlightFlightMarker === 'function') {
        svc.highlightFlightMarker(flight.id, '#b71c1c');
      }
    }
  }

  @Input() alerts: FireAlert[] = [];
  @Input() width: number = 0;
  @Input() height: number = 0;
  @Input() compact: boolean = false;
  // Always hide time range selector in fire alert tile
  showTimeRangeSelector: boolean = false;

  /**
   * Returns FAA info for a flight, normalizing the N-number key.
   * Returns null if not found or not a valid N-number.
   */
  getFaaInfoForFlight(flight: FlightInfo): FaaAircraft | null {
    const n = (flight.callSign || flight.id || '').toUpperCase();
    // Only US N-numbers
    if (!/^N[0-9A-Z]+$/.test(n)) return null;
    // Normalize: always starts with 'N', no regex in template
    const nNumber = n.startsWith('N') ? n : `N${n}`;
    return this.faaInfo[nNumber] ?? null;
  }

  @HostBinding('class.full-height') fullHeight = true;

  flights: FlightInfo[] = [];
  faaInfo: { [nNumber: string]: FaaAircraft | null } = {};
  get filteredFlights(): FlightInfo[] {
    if (this.showAllFlights) {
      return this.flights;
    }
    // Filter out commercial flights, only show public safety/non-commercial
    const commercialPrefixes = [
      'AAL', 'UAL', 'DAL', 'SWA', 'JBU', 'FFT', 'SKW', 'ASA', 'WJA', 'AFR', 'TAP', 'DLH', 'ENY', 'ATN', 'ROU', 'SCX', 'JSX', 'VJA', 'GTI', 'CTF', 'PFT', 'TAI', 'INTEL', 'LOST', 'SPAR', 'EJA', 'EJM', 'LXJ', 'ENY', 'WJA', 'TOPCT', 'TWY', 'CAP', 'RANGR', 'ERU'
    ];
    const publicSafetyKeywords = ['POLICE', 'FIRE', 'RESCUE', 'MED', 'EMS', 'LIFE', 'SHERIFF', 'LAW', 'AMBULANCE'];
    return this.flights.filter(flight => {
      const cs = (flight.callSign || flight.id || '').toUpperCase();
      // Show if public safety keyword
      if (publicSafetyKeywords.some(kw => cs.includes(kw))) return true;
      // Show if US government N-number (starts with N and is not a known commercial code)
      if (/^N[0-9A-Z]+$/.test(cs) && !commercialPrefixes.some(p => cs.startsWith(p))) return true;
      // Otherwise, filter out if commercial
      return !commercialPrefixes.some(p => cs.startsWith(p));
    });
  }
  currentTime!: string;
  utcTime!: string;
  timeSubscription?: Subscription | undefined;

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
    private openSkyService: OpenSkyService,
    private nasaFirmsService: NasaFirmsService,
    private faaService: FaaService,
  ) {
    console.log('STEP 1: FireAlertComponent initialized');
  }

  ngOnInit(): void {
    console.log('STEP 2: ngOnInit called');
    this.selectedCity = this.cities[0] as City;
    this.startCurrentTimeStream(this.selectedCity);
    // DEMO: Fetch flights for LA area using OpenSky public API
    this.openSkyService.getNearbyFlights(33.5, -118.5, 34.5, -117.5).subscribe((data: any) => {
      if (data && data.states) {
        this.flights = data.states.map((s: any[]) => ({
          callSign: s[1],
          id: s[0],
          altitude: s[7],
          lat: s[6],
          lon: s[5],
        }));
        this.lookupFaaInfoForFlights();
      }
    });

  }

  private lookupFaaInfoForFlights(): void {
    for (const flight of this.flights) {
      const nNumber = (flight.callSign || flight.id || '').toUpperCase().replace(/^N/, 'N');
      if (/^N[0-9A-Z]+$/.test(nNumber) && !this.faaInfo[nNumber]) {
        this.faaService.lookupNNumber(nNumber).subscribe(result => {
          this.faaInfo[nNumber] = result.found ? result.aircraft || null : null;
        });
      }
    }
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

  onTabChange(event: MatTabChangeEvent): void {
    const city = this.cities[event.index];
    if (!city || city === this.selectedCity) return;

    // Clean up previous intervals/subscriptions
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
      this.timeSubscription = undefined;
    }
    if (this.flightUpdateInterval) {
      this.flightUpdateInterval.unsubscribe();
      this.flightUpdateInterval = undefined;
    }
    this.mapboxService.destroyMap();

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

  private flightUpdateInterval?: Subscription | undefined;

  fetchFlightData(city: City): void {
    console.log('STEP 6: Fetching OpenSky flight data');

    const updateFlights = () => {
      const radiusKm = city.radiusKm ?? 120;
      const bounds = this.calculateBoundingBox(city.coords.lat, city.coords.lng, radiusKm);
      this.openSkyService.getNearbyFlights(bounds[1], bounds[0], bounds[3], bounds[2]).subscribe((data: any) => {
        if (data && data.states) {
          this.flights = data.states.map((s: any[]) => ({
            callSign: s[1],
            id: s[0],
            altitude: s[7],
            latitude: s[6],
            longitude: s[5],
          }));
          // Clear all flight markers before adding only filtered flights
          this.mapboxService.clearFlightMarkers();
          const flightsToShow = this.showAllFlights ? this.flights : this.filteredFlights;
          flightsToShow.forEach(flight => {
            if (flight.latitude !== undefined && flight.longitude !== undefined) {
              this.mapboxService.upsertFlightMarker(
                flight.id,
                [flight.longitude, flight.latitude],
                `Flight ${flight.callSign || flight.id}`
              );
            }
          });
        } else {
          this.flights = [];
          this.mapboxService.clearFlightMarkers();
        }
      }, error => {
        console.error('Error fetching OpenSky flights', error);
        this.flights = [];
        this.mapboxService.clearFlightMarkers();
      });
    };

    // Clear any previous interval
    if (this.flightUpdateInterval) {
      this.flightUpdateInterval.unsubscribe();
    }
    // Initial fetch
    updateFlights();
    // Poll every 30 seconds
    this.flightUpdateInterval = interval(30000).subscribe(() => updateFlights());
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
            if (mapElement && (mapElement as unknown as { _map?: { resize: () => void } })._map) {
              (mapElement as unknown as { _map: { resize: () => void } })._map.resize();
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
    if (this.flightUpdateInterval) {
      this.flightUpdateInterval.unsubscribe();
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
