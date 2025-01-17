import { Injectable } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MapboxService {
  private map: mapboxgl.Map | null = null;

  constructor() {
    mapboxgl.accessToken = environment.mapbox.accessToken;
    console.log('Mapbox access token:', environment.mapbox.accessToken);
  }

  /**
   * Initialize a Mapbox map
   * @param containerId - ID of the HTML container for the map
   * @param center - [lng, lat] coordinates to center the map
   * @param zoom - Initial zoom level
   */
  initializeMap(containerId: string, center: [number, number] = [-118.2437, 34.0522], zoom: number = 10): mapboxgl.Map {
    if (this.map) {
      this.map.remove(); // Clean up any existing map instance
    }

    this.map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/streets-v11', // Default style
      center: center,
      zoom: zoom,
    });

    return this.map;
  }

  /**
   * Add a marker to the map
   * @param lngLat - [lng, lat] coordinates for the marker
   * @param popupText - Optional text for a popup
   */
  addMarker(lngLat: [number, number], popupText?: string): void {
    if (!this.map) {
      console.error('Map is not initialized. Call initializeMap() first.');
      return;
    }

    const marker = new mapboxgl.Marker().setLngLat(lngLat).addTo(this.map);

    if (popupText) {
      const popup = new mapboxgl.Popup().setText(popupText);
      marker.setPopup(popup).togglePopup();
    }
  }

  addPolyline(coordinates: [number, number][]): void {
    if (!this.map) {
      console.error('Map is not initialized. Call initializeMap() first.');
      return;
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
  /**
   * Clean up the map instance
   */
  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
