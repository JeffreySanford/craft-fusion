import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment'; // Corrected relative path
import * as mapboxgl from 'mapbox-gl';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapboxService {
  private map: mapboxgl.Map | undefined;

  constructor() {
    // Set Mapbox access token using Object.assign to avoid esbuild import mutation
    Object.assign(mapboxgl, { accessToken: (environment as unknown).mapboxToken });
  }

  initializeMap(container: string, center: [number, number], zoom: number): mapboxgl.Map {
    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v11',
      center,
      zoom
    });
    return this.map;
  }

  addMarker(coordinates: [number, number], message: string): void {
    if (!this.map) {
      console.error('Map is not initialized. Call initializeMap() first.');
      return;
    }
    
    new mapboxgl.Marker()
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<h3>${message}</h3>`))
      .addTo(this.map);
  }

  // Add resizeMap method (was missing from this service)
  resizeMap(): void {
    if (this.map) {
      this.map.resize();
    } else {
      console.warn('Cannot resize map: Map is not initialized');
    }
  }

  addPolyline(coordinates: [number, number][]): void {
    if (!this.map) {
      console.error('Map is not initialized. Call initializeMap() first.');
      return;
    }

    // Check if layer already exists, remove it first to prevent duplicates
    if (this.map.getLayer('route')) {
      this.map.removeLayer('route');
    }
    
    if (this.map.getSource('route')) {
      this.map.removeSource('route');
    }

    this.map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#888',
        'line-width': 8,
      },
    });
  }

  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined; // Clear reference after removing
    }
  }
}
