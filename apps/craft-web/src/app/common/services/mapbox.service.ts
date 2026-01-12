import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';                           
import * as mapboxgl from 'mapbox-gl';

@Injectable({
  providedIn: 'root',
})
export class MapboxService {
  private map: mapboxgl.Map | undefined;
  private markers: mapboxgl.Marker[] = [];
  private flightMarkers: mapboxgl.Marker[] = [];

  constructor() {

    const token = (environment as any)?.mapboxToken ?? '';
    Object.assign(mapboxgl, { accessToken: token });
  }

  initializeMap(container: string, center: [number, number], zoom: number): mapboxgl.Map {
    if (this.map) {
      this.destroyMap();
    }
    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v11',
      center,
      zoom,
    });
    return this.map;
  }

  addMarker(coordinates: [number, number], message: string): void {
    if (!this.map) {
      console.error('Map is not initialized. Call initializeMap() first.');
      return;
    }

    const marker = new mapboxgl.Marker()
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<h3>${message}</h3>`))
      .addTo(this.map);
    this.markers.push(marker);
  }

  addFlightMarker(coordinates: [number, number], message: string): void {
    if (!this.map) {
      return;
    }
    const marker = new mapboxgl.Marker({ color: '#1d3557' })
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${message}</strong>`))
      .addTo(this.map);
    this.flightMarkers.push(marker);
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  clearFlightMarkers(): void {
    this.flightMarkers.forEach(marker => marker.remove());
    this.flightMarkers = [];
  }

  fitBounds(bounds: [number, number, number, number], padding: number = 40): void {
    if (this.map) {
      this.map.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ],
        { padding }
      );
    }
  }

  flyTo(center: [number, number], zoom: number = 10): void {
    if (this.map) {
      this.map.flyTo({ center, zoom });
    }
  }

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
      this.clearMarkers();
      this.clearFlightMarkers();
      this.map.remove();
      this.map = undefined;                                  
    }
  }
}
