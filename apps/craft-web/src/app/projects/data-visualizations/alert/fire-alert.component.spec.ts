import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FireAlertComponent } from './fire-alert.component';
import { MapboxService } from '../../../common/services/mapbox.service';
import { FlightRadarService } from '../../../common/services/flightradar.service';
import { of } from 'rxjs';
import mapboxgl from 'mapbox-gl';

describe('FireAlertComponent', () => {
  let component: FireAlertComponent;
  let fixture: ComponentFixture<FireAlertComponent>;
  let mapboxService: jest.Mocked<MapboxService>;
  let flightRadarService: jest.Mocked<FlightRadarService>;

  const mockMap = {
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'load') {
        setTimeout(() => callback(), 0);
      }
      return mockMap;
    }),
    resize: jest.fn(),
    remove: jest.fn(),
    getLayer: jest.fn().mockReturnValue(false),
    getSource: jest.fn().mockReturnValue(false),
    addLayer: jest.fn(),
  };

  const mockCities = [
    {
      name: 'City A',
      state: 'State A',
      timezone: 'PST',
      timezoneOffset: -8,
      coords: { lat: 34.0522, lng: -118.2437 },
      alerts: [
        { id: 1, name: 'Alert 1', time: '2023-10-01T10:00:00Z', level: 'High Priority' },
        { id: 2, name: 'Alert 2', time: '2023-10-01T12:00:00Z', level: 'Medium Priority' },
      ],
    },
    {
      name: 'City B',
      state: 'State B',
      timezone: 'EST',
      timezoneOffset: -5,
      coords: { lat: 36.1699, lng: -115.1398 },
      alerts: [
        { id: 3, name: 'Alert 3', time: '2023-10-02T14:00:00Z', level: 'Low Priority' },
        { id: 4, name: 'Alert 4', time: '2023-10-02T16:00:00Z', level: 'High Priority' },
      ],
    },
  ];

  beforeEach(async () => {
    // Create proper mocks for the services using Jest
    mapboxService = {
      initializeMap: jest.fn().mockReturnValue(mockMap as unknown as mapboxgl.Map),
      addMarker: jest.fn(),
      resizeMap: jest.fn(),
      destroyMap: jest.fn(),
      addPolyline: jest.fn(),
    } as unknown as jest.Mocked<MapboxService>;

    flightRadarService = {
      getFlightsByBoundingBox: jest.fn().mockReturnValue(of([])),
      getFlightById: jest.fn().mockReturnValue(
        of({
          flight: {
            callSign: 'TEST123',
            altitude: 35000,
            origin: 'LAX',
            destination: 'JFK',
            aircraft: {
              model: 'B737',
              registration: 'N12345',
            },
          },
        }),
      ),
    } as unknown as jest.Mocked<FlightRadarService>;

    await TestBed.configureTestingModule({
      declarations: [FireAlertComponent],
      providers: [
        { provide: MapboxService, useValue: mapboxService },
        { provide: FlightRadarService, useValue: flightRadarService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FireAlertComponent);
    component = fixture.componentInstance;
    component.cities = mockCities;

    // Create mock DOM element for map container
    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-1';
    document.body.appendChild(mapContainer);

    fixture.detectChanges();
  });

  afterEach(() => {
    const mapContainer = document.getElementById('map-1');
    if (mapContainer) {
      document.body.removeChild(mapContainer);
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the map', () => {
    expect(mapboxService.initializeMap).toHaveBeenCalled();
  });

  it('should resize the map when handleResize is called', () => {
    component.handleResize();
    expect(mapboxService.resizeMap).toHaveBeenCalled();
  });

  it('should handle tab change correctly', () => {
    // Setup
    mapboxService.initializeMap.mockClear();

    // Execute
    component.onTabChange({ index: 1 });

    // Verify
    expect(component.selectedCity).toBe(mockCities[1]);
    expect(mapboxService.initializeMap).toHaveBeenCalled();
  });

  it('should clean up resources on destroy', () => {
    component.ngOnDestroy();
    expect(mapboxService.destroyMap).toHaveBeenCalled();
  });
});
