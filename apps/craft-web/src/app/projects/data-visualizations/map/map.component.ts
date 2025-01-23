import { AfterViewInit, Component, ElementRef, OnInit, OnDestroy, Renderer2, ViewChild, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import * as shapefile from 'shapefile';
import { Observable, of, Subject, from } from 'rxjs';
import { catchError, takeUntil, mergeMap } from 'rxjs/operators';
import { MapChartData } from '../data-visualizations.interfaces';

interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSON.Feature[];
}

@Component({
  selector: 'app-map-chart',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: false
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() data: MapChartData[] | undefined;
  @Input() geojsonData: GeoJSONCollection | undefined; // Add input for pre-extracted GeoJSON data
  @ViewChild('chart') private chartContainer: ElementRef | undefined;
  logoUrl = 'https://www.naturalearthdata.com/wp-content/themes/NEV/images/nev_logo.png';
  
  private destroy$ = new Subject<void>();

  constructor(private renderer: Renderer2, private http: HttpClient) {}

  ngOnInit(): void {
    console.log('Step 1: Component initialized');
  }

  ngAfterViewInit(): void {
    console.log('Step 2: AfterViewInit - Start loading shapefile');
    if (this.chartContainer && this.geojsonData) {
      console.log('Step 3: GeoJSON data provided, starting D3 map creation');
      this.createUSMap(this.geojsonData);
    }
  }

  ngOnDestroy(): void {
    console.log('Component is being destroyed. Cleaning up subscriptions.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  createUSMap(geojsonData: GeoJSONCollection): void {
    console.log('Step 4: Creating D3 map visualization');
    console.log('GeoJSON Data:', geojsonData); // Debugging: Log the GeoJSON data

    debugger
    const element = this.chartContainer?.nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;

    const svgElement = this.renderer.createElement('svg', 'svg');
    this.renderer.setAttribute(svgElement, 'width', `${width}`);
    this.renderer.setAttribute(svgElement, 'height', `${height}`);
    this.renderer.appendChild(element, svgElement);

    const svg = d3.select<SVGSVGElement, unknown>(svgElement);

    const projection = d3.geoAlbersUsa()
      .fitSize([width, height], geojsonData); // Dynamically fit the projection to the container size

    const path = d3.geoPath().projection(projection);

    const g = svg.append('g');

    // Add zoom and pan functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    g.selectAll('path')
      .data(geojsonData.features)
      .enter()
      .append('path')
      .attr('d', (d: any) => {
        const pathData = path(d);
        console.log('Path Data:', pathData); // Debugging: Log the path data
        if (!pathData) {
          console.error('Invalid path data for feature:', d);
          console.error('Feature Geometry:', d.geometry); // Log the feature geometry for debugging
        }
        return pathData;
      })
      .attr('fill', '#69b3a2') // Default fill color
      .attr('stroke', 'black')
      .on('mouseover', function () {
        d3.select(this).attr('fill', 'orange'); // Change color on hover
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#69b3a2'); // Revert color on mouse out
      });
    console.log('Step 4.3: All states rendered');
  }
}
