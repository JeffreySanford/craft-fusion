import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { MapboxService } from '../../../common/services/mapbox.service';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-fire-alert',
  standalone: false,
  templateUrl: './fire-alert.component.html',
  styleUrls: ['./fire-alert.component.scss'],
})
export class FireAlertComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() alerts: any[] = [];

  // Legend items for visualization
  legendItems: string[] = ['High Priority', 'Medium Priority', 'Low Priority'];

  // Temporary hash map of city names and coordinates
  cityCoordinates: { [key: string]: [number, number] } = {
    'Los Angeles': [-118.2437, 34.0522],
    'New York': [-74.006, 40.7128],
    'Chicago': [-87.6298, 41.8781],
  };

  constructor(private mapboxService: MapboxService) {}

  ngOnInit(): void {
    console.log('ngOnInit called');
  }

  ngAfterViewInit(): void {
    this.initializeMap('Los Angeles'); // Default city
  }

  initializeMap(city: string): void {
    const coordinates = this.cityCoordinates[city]; // Default to Los Angeles if city not found
    const map = this.mapboxService.initializeMap('map', coordinates, 12);

    map.on('click', (event) => {
      const coords = event.lngLat;
      const alertMessage = `Alert triggered at [${coords.lng}, ${coords.lat}]`;
      this.alerts.push(alertMessage);
      this.mapboxService.addMarker([coords.lng, coords.lat], alertMessage);
    });
  }

  // Focus on a specific alert
  focusAlert(alert: any): void {
    console.log('Focused alert:', alert);
    // Add logic for focusing/handling the alert
  }

  ngOnDestroy(): void {
    this.mapboxService.destroyMap();
  }
}
