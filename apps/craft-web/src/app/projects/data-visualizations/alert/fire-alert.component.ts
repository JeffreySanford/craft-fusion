import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapboxService } from '../../../common/services/mapbox.service';

@Component({
  selector: 'app-fire-alert',
  standalone: false,
  templateUrl: './fire-alert.component.html',
  styleUrl: './fire-alert.component.scss',
})
export class FireAlertComponent implements OnInit, OnDestroy {
  alerts: string[] = [
    'LA'
  ];

  constructor(private mapboxService: MapboxService) {}

  ngOnInit(): void {
    console.log('ngOnInit called');
    const map = this.mapboxService.initializeMap('map', [-118.2437, 34.0522], 12);

    map.on('click', (event) => {
      const coords = event.lngLat;
      const alertMessage = `Alert triggered at [${coords.lng}, ${coords.lat}]`;
      this.alerts.push(alertMessage);
      this.mapboxService.addMarker([coords.lng, coords.lat], alertMessage);
    });
    
  }

  ngOnDestroy(): void {
    this.mapboxService.destroyMap();
  }
}
