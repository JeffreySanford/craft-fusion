import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FireAlertComponent } from './fire-alert.component';
import { MapboxService } from '../../../common/services/mapbox.service';
import { OpenSkiesService } from '../../../common/services/openskies.service';
import { NasaFirmsService } from '../../../common/services/nasa-firms.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('FireAlertComponent', () => {
  let component: FireAlertComponent;
  let fixture: ComponentFixture<FireAlertComponent>;
  let mapboxService: jest.Mocked<MapboxService>;
  let openSkiesService: jest.Mocked<OpenSkiesService>;
  let nasaFirmsService: jest.Mocked<NasaFirmsService>;

  const mockMap = {
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'load') {
        callback();
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
      mapId: 'los-angeles',
      alerts: [],
    },
    {
      name: 'City B',
      state: 'State B',
      timezone: 'EST',
      timezoneOffset: -5,
      coords: { lat: 36.1699, lng: -115.1398 },
      mapId: 'city-b',
      alerts: [],
    },
  ];

  beforeEach(async () => {

    mapboxService = {
      initializeMap: jest.fn().mockReturnValue(mockMap as unknown as mapboxgl.Map),
      addMarker: jest.fn(),
      addFlightMarker: jest.fn(),
      resizeMap: jest.fn(),
      destroyMap: jest.fn(),
      addPolyline: jest.fn(),
      clearMarkers: jest.fn(),
      clearFlightMarkers: jest.fn(),
      fitBounds: jest.fn(),
      flyTo: jest.fn(),
    } as unknown as jest.Mocked<MapboxService>;

    openSkiesService = {
      fetchFlightData: jest.fn().mockReturnValue(of([])),
      fetchAirportData: jest.fn().mockReturnValue(of([])),
      fetchFlightDataByAirline: jest.fn().mockReturnValue(of([])),
      fetchFlightDataByAircraft: jest.fn().mockReturnValue(of([])),
    } as unknown as jest.Mocked<OpenSkiesService>;

    nasaFirmsService = {
      getActiveFires: jest.fn().mockReturnValue(of([])),
    } as unknown as jest.Mocked<NasaFirmsService>;

    await TestBed.configureTestingModule({
      declarations: [FireAlertComponent],
      imports: [FormsModule, MatCardModule, MatTabsModule, MatButtonToggleModule, MatTooltipModule],
      providers: [
        { provide: MapboxService, useValue: mapboxService },
        { provide: OpenSkiesService, useValue: openSkiesService },
        { provide: NasaFirmsService, useValue: nasaFirmsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FireAlertComponent);
    component = fixture.componentInstance;
    component.cities = mockCities;
    component.ngOnInit();

    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-los-angeles';
    document.body.appendChild(mapContainer);

    const mapContainerB = document.createElement('div');
    mapContainerB.id = 'map-city-b';
    document.body.appendChild(mapContainerB);

    // Don't call detectChanges here
  });

  afterEach(() => {
    const mapContainer = document.getElementById('map-los-angeles');
    if (mapContainer) {
      document.body.removeChild(mapContainer);
    }
    const mapContainerB = document.getElementById('map-city-b');
    if (mapContainerB) {
      document.body.removeChild(mapContainerB);
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should initialize the map', fakeAsync(() => {
  //   fixture.detectChanges();
  //   document.body.appendChild(fixture.nativeElement);
  //   fixture.detectChanges();
  //   component.ngAfterViewInit();
  //   tick(0);
  //   expect(mapboxService.initializeMap).toHaveBeenCalled();
  // }));

  // it('should resize the map when handleResize is called', fakeAsync(() => {
  //   component.handleResize();
  //   tick(300);
  //   expect(mapboxService.resizeMap).toHaveBeenCalled();
  // }));

  // it('should handle tab change correctly', fakeAsync(() => {
  //   mapboxService.initializeMap.mockClear();
  //   component.onTabChange({ index: 1 });
  //   tick(0);
  //   expect(component.selectedCity).toBe(mockCities[1]);
  //   expect(mapboxService.initializeMap).toHaveBeenCalled();
  // }));

  // it('should clean up resources on destroy', () => {
  //   component.ngOnDestroy();
  //   expect(mapboxService.destroyMap).toHaveBeenCalled();
  // });
});
