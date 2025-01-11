import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-fire-alert',
  standalone: false,
  templateUrl: './fire-alert.component.html',
  styleUrl: './fire-alert.component.scss',
})
export class FireAlertComponent implements OnInit, AfterViewInit {
  map!: mapboxgl.Map;

  ngOnInit() {
    console.log('ngOnInit called');
    (mapboxgl as any).accessToken = 'pk.eyJ1IjoiamVmZnJleXNhbmZvcmQiLCJhIjoiY201c2psaW8yMG1vMDJrcTJ4ZzNic3YxbyJ9.7e5Pub4Ub0v-tHK9uzIuEA';
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      console.log('Map container found');
      this.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-118.2437, 34.0522], // Coordinates for Los Angeles
        zoom: 10
      });

      this.map.on('load', () => {
        console.log('Map has been loaded');
      });

      this.map.on('error', (error) => {
        console.error('Mapbox error:', error);
      });
    } else {
      console.error('Map container not found');
    }
  }
}
