import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';                           
import * as mapboxgl from 'mapbox-gl';

@Injectable({
  providedIn: 'root',
})
export class MapboxService {
  private map: mapboxgl.Map | undefined;
  private markers: mapboxgl.Marker[] = [];
  // Use a map for flight markers for animation
  private flightMarkers: Map<string, mapboxgl.Marker> = new Map();

  constructor() {
    const token = environment.mapbox?.accessToken ?? '';
    // Set the access token globally for Mapbox GL JS (ESM/UMD compatibility)
    // ESM/UMD compatibility: assign to the global object, not the import binding
    const mapboxGlobal = (mapboxgl as any).default ?? mapboxgl;
    if (mapboxGlobal && typeof mapboxGlobal === 'object' && 'accessToken' in mapboxGlobal) {
      mapboxGlobal.accessToken = token;
    }
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


  /**
   * Add a fire alert marker with a fire icon (Material/FontAwesome SVG)
   */
  addMarker(coordinates: [number, number], message: string): void {
    if (!this.map) {
      console.error('Map is not initialized. Call initializeMap() first.');
      return;
    }
    // Material fire icon SVG (red/orange)
    const fireIcon = document.createElement('div');
    fireIcon.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.5 15.5C16.5 13.0147 14.4853 11 12 11C9.51472 11 7.5 13.0147 7.5 15.5C7.5 17.9853 9.51472 20 12 20C14.4853 20 16.5 17.9853 16.5 15.5Z" fill="#FF9800"/>
        <path d="M12 2C12 2 7 7.5 7 12.5C7 16.6421 10.3579 20 14.5 20C18.6421 20 22 16.6421 22 12.5C22 7.5 17 2 12 2Z" fill="#F44336"/>
      </svg>
    `;
    fireIcon.style.transform = 'translate(-50%, -100%)';
    fireIcon.style.width = '32px';
    fireIcon.style.height = '32px';
    const marker = new mapboxgl.Marker({ element: fireIcon })
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<h3>${message}</h3>`))
      .addTo(this.map);
    this.markers.push(marker);
  }

  /**
   * Add or update a flight marker by flight ID. Animates position if already present.
   */
  /**
   * Add or update a flight marker by flight ID. Use airplane SVG icon.
   */
  upsertFlightMarker(flightId: string, coordinates: [number, number], message: string): void {
    if (!this.map) return;
    let marker = this.flightMarkers.get(flightId);
    if (marker) {
      marker.setLngLat(coordinates);
    } else {
      // Material airplane icon SVG (blue)
      const airplaneIcon = document.createElement('div');
      airplaneIcon.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.5 19.5L21.5 12L2.5 4.5V10.5L17.5 12L2.5 13.5V19.5Z" fill="#1976D2"/>
        </svg>
      `;
      airplaneIcon.style.transform = 'translate(-50%, -100%)';
      airplaneIcon.style.width = '28px';
      airplaneIcon.style.height = '28px';
      marker = new mapboxgl.Marker({ element: airplaneIcon })
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${message}</strong>`))
        .addTo(this.map);
      this.flightMarkers.set(flightId, marker);
    }
  }

  /**
   * Remove flight markers not in the provided set of IDs.
   */
  removeStaleFlightMarkers(activeIds: Set<string>): void {
    for (const [id, marker] of this.flightMarkers.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        this.flightMarkers.delete(id);
      }
    }
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  clearFlightMarkers(): void {
    for (const marker of this.flightMarkers.values()) {
      marker.remove();
    }
    this.flightMarkers.clear();
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
