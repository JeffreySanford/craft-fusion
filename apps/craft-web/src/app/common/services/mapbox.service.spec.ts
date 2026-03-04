// when importing MapboxService we need to stub mapboxgl because its
// accessToken property is read-only in the test environment.

import { TestBed } from '@angular/core/testing';
import * as mapboxgl from 'mapbox-gl';

// make accessToken configurable
Object.defineProperty(mapboxgl, 'accessToken', {
  writable: true,
  value: '',
});

import { MapboxService } from './mapbox.service';

describe('MapboxService', () => {
  let service: MapboxService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MapboxService] });
    service = TestBed.inject(MapboxService);
  });
  it('should be created', () => expect(service).toBeTruthy());
});