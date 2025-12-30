import { Component, OnInit, OnDestroy, AfterViewInit, Input, HostBinding, SimpleChanges } from '@angular/core';
import { MapboxService } from '../../../common/services/mapbox.service';
import { Flight, FlightRadarService } from '../../../common/services/flightradar.service';
import { interval, Subscription } from 'rxjs';
import moment from 'moment-timezone';

interface City {
  name: string;
  state: string;
  coords: { lat: number; lng: number };
  alerts: { id: number; name: string; time: string; level: string; }[];
  timezoneOffset: number;
  timezone: string;
}

@Component({
  selector: 'app-fire-alert',
  templateUrl: './fire-alert.component.html',
  styleUrls: ['./fire-alert.component.scss'],
  standalone: false,
  host: {
    class: 'grid-tile large-tile' // Add grid-specific classes
  }
})
export class FireAlertComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() alerts: string[] = [];
  @Input() width: number = 0;
  @Input() height: number = 0;

  @HostBinding('class.full-height') fullHeight = true;

  fr24Flights: Flight[] = [];

  flights: Flight[] = [];
  currentTime!: string;
  utcTime!: string;
  timeSubscription?: Subscription;
  
  // Track if dimensions have changed
  private lastWidth: number = 0;
  private lastHeight: number = 0;

  cities: City[] = [
    {
      name: 'Los Angeles',
      state: 'California',
      coords: { lat: 34.0522, lng: -118.2437 },
      alerts: [
        { id: 1, name: 'Mock Alert', time: '2023-10-01T10:00:00Z', level: 'High Priority' },
        { id: 2, name: 'Alert 2', time: '2023-10-01T12:00:00Z', level: 'Medium Priority' }
      ],
      timezoneOffset: -8,
      timezone: 'PDT -08:00'
    },
    {
      name: 'New York',
      state: 'New York',
      coords: { lat: 40.7128, lng: -74.0060 },
      alerts: [
        { id: 3, name: 'Alert 3', time: '2023-10-02T14:00:00Z', level: this.getRandomLevel() },
        { id: 4, name: 'Alert 4', time: '2023-10-02T16:00:00Z', level: this.getRandomLevel() }
      ],
      timezoneOffset: -5,
      timezone: 'EDT -05:00'
    },
    {
      name: 'Chicago',
      state: 'Illinois',
      coords: { lat: 41.8781, lng: -87.6298 },
      alerts: [
        { id: 5, name: 'Alert 5', time: '2023-10-03T18:00:00Z', level: this.getRandomLevel() },
        { id: 6, name: 'Alert 6', time: '2023-10-03T20:00:00Z', level: this.getRandomLevel() }
      ],
      timezoneOffset: -6,
      timezone: 'CDT -06:00'
    }
  ];
  selectedCity!: City; // Will be set in ngOnInit
  selectedPriorityLevel: string = 'All';

  constructor(
    private mapboxService: MapboxService,
    private flightRadarService: FlightRadarService
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
    if (this.selectedCity && this.selectedCity.alerts && this.selectedCity.alerts[0]) {
      this.initializeMap(this.selectedCity.name, this.selectedCity.alerts[0].id); // Initialize the first tab by default
    }

    this.fetchFlightData();
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  // Add ngOnChanges to handle dimension changes
  ngOnChanges(changes: SimpleChanges): void {
    // Check if width or height has changed
    if ((changes['width'] && this.lastWidth !== changes['width'].currentValue) || 
        (changes['height'] && this.lastHeight !== changes['height'].currentValue)) {
      
      this.lastWidth = this.width;
      this.lastHeight = this.height;
      
      // Re-initialize map with new dimensions if already initialized
      if (this.selectedCity && this.selectedCity.alerts && this.selectedCity.alerts.length > 0) {
        setTimeout(() => {
          const firstAlert = this.selectedCity.alerts[0];
          if (firstAlert) this.initializeMap(this.selectedCity.name, firstAlert.id);
        }, 100);
      }
    }
  }

  // Improve map initialization to handle resize better
  initializeMap(city: string, alertId: number): void {
    console.log('STEP 4: Initializing map for city', city);
    const cityObj = this.cities.find(c => c.name === city);
    const coordinates = cityObj ? cityObj.coords : { lat: 34.0522, lng: -118.2437 };
    
    // Use container heights/widths from inputs if provided, otherwise let CSS handle it
    const mapContainer = document.getElementById(`map-${alertId}`);
    if (!mapContainer) {
      console.error(`Map container for alert ${alertId} not found`);
      return;
    }
    
    // Calculate available height for the map based on container size
    const containerHeight = mapContainer.parentElement?.clientHeight || 400;
    const statusHeight = 180;
    const mapHeight = Math.max(200, containerHeight - statusHeight);
    
    if (this.width && this.height) {
      mapContainer.style.width = `${this.width}px`;
      mapContainer.style.height = `${this.height}px`;
    } else {
      // Set a reasonable height based on container size
      mapContainer.style.height = `${mapHeight}px`;
      // Ensure width is 100% for responsive behavior
      mapContainer.style.width = '100%';
    }
    
    try {
      const map = this.mapboxService.initializeMap(`map-${alertId}`, [coordinates.lng, coordinates.lat], 12);
      this.startCurrentTimeStream(this.selectedCity);

      map.on('load', () => {
        console.log(`Map for alert ${alertId} in ${city} loaded`);
        // Force map resize with a longer delay to ensure container is fully rendered
        setTimeout(() => {
          try {
            if (typeof this.mapboxService.resizeMap === 'function') {
              this.mapboxService.resizeMap();
            } else {
              // Fallback - trigger native resize if service method is unavailable
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
        this.alerts.push(alertMessage);
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

    if (this.selectedCity && this.selectedCity.alerts && this.selectedCity.alerts.length > 0) {
      const firstAlert = this.selectedCity.alerts[0];
      if (firstAlert) {
        this.initializeMap(this.selectedCity.name, firstAlert.id);
        this.startCurrentTimeStream(this.selectedCity);
      }
    }

    // Add additional resize call after tab animation completes
    setTimeout(() => {
      this.handleResize();
    }, 350);
  }

  fetchFlightData(): void {
    console.log('STEP 6: Fetching flight data');
    // Example bounding box coordinates for Los Angeles area
    const lat1 = 33.5;
    const lon1 = -118.5;
    const lat2 = 34.5;
    const lon2 = -117.5;

    this.flightRadarService.getFlightsByBoundingBox(lat1, lon1, lat2, lon2).subscribe(
      data => {
        console.log('STEP 7: Flight data fetched', data);

        // Process and display flight data on the map
        this.fr24Flights = data;

        this.fr24Flights.forEach((flight: Flight) => {
          // for each flight, look up the information for the flight and include it on the addMarker report
          const coordinates: [number, number] = [flight.status.currentLocation.longitude, flight.status.currentLocation.latitude];

          this.flightRadarService.getFlightById(flight.aircraft.registration).subscribe(
            (next: { flight: Flight }) => {
              console.log('STEP 7.1: Flight data fetched', next);
              // Process and display flight data on the map
              const flightInfo: Flight = next.flight;
              this.flights.push(flightInfo);

              this.mapboxService.addMarker(coordinates, `Flight: ${flightInfo.id} - ${flightInfo.origin.name} to ${flightInfo.destination.name} - ${flightInfo.aircraft.model}`);
            },
            (error: any) => {
              console.error('Error fetching flight by ID', error);
            },
            () => {
              console.log('Flight data fetch completed');
            }
          );
        }); 
      },
    );
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

  getPriorityClass(item: string): string {
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

  getRandomLevel(): string {
    const levels = ['High Priority', 'Medium Priority', 'Low Priority', 'None'];
    return levels[Math.floor(Math.random() * levels.length)] as string;
  }

  // Focus on a specific alert
  focusAlert(alert: unknown): void {
    console.log('STEP 10: Focused alert', alert);
    // Add logic for focusing/handling the alert
  }

  handleResize(): void {
    // Resize map if already initialized
    if (this.selectedCity && this.selectedCity.alerts && this.selectedCity.alerts.length > 0) {
      const firstAlert = this.selectedCity?.alerts?.[0];
      if (!firstAlert) return;
      const alertId = firstAlert.id;
      const mapContainer = document.getElementById(`map-${alertId}`);
      
      if (mapContainer) {
        // Adjust map size based on current container dimensions
        const containerHeight = mapContainer.parentElement?.clientHeight || 400;
        const statusHeight = 180; // Approximate height of status container
        const mapHeight = Math.max(200, containerHeight - statusHeight);
        
        if (!this.width && !this.height) {
          // Only adjust height if not explicitly set by inputs
          mapContainer.style.height = `${mapHeight}px`;
        }
      }
      
      // Important: Use a short delay to ensure DOM is updated before resizing map
      setTimeout(() => {
        try {
          // Make sure we're using the correct service instance
          if (this.mapboxService && typeof this.mapboxService.resizeMap === 'function') {
            this.mapboxService.resizeMap();
            console.log('Map resized successfully');
          } else {
            console.error('MapboxService resizeMap method not available', this.mapboxService);
            // Fallback option if possible
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
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  // Filter alerts based on selected priority level
  filteredAlerts(city: City): { id: number; name: string; time: string; level: string }[] {
    if (!city.alerts) return [];
    
    if (this.selectedPriorityLevel === 'All') {
      return city.alerts;
    }
    
    return city.alerts.filter(alert => alert.level === this.selectedPriorityLevel);
  }
}
