import { AfterViewInit, Component, ElementRef, OnInit, OnDestroy, Renderer2, ViewChild, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import JSZip from 'jszip';
import * as shapefile from 'shapefile';
import { Observable, of, Subject, from } from 'rxjs';
import { catchError, mergeMap, takeUntil, switchMap } from 'rxjs/operators';
import { MapChartData } from '../data-visualizations.interfaces';

interface ShapefileResult {
  done: boolean;
  value?: GeoJSON.Feature;
}

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
  @ViewChild('chart') private chartContainer: ElementRef | undefined;

  private shapefileUrl = '/census/geo/tiger/GENZ2021/shp/cb_2021_us_state_20m.zip';
  logoUrl = 'https://www.naturalearthdata.com/wp-content/themes/NEV/images/nev_logo.png';
  private blobSubject = new Subject<Blob>();
  private unzipSubject = new Subject<JSZip>();
  private destroy$ = new Subject<void>();

  constructor(private renderer: Renderer2, private http: HttpClient) {}

  ngOnInit(): void {
    console.log('Step 1: Component initialized');
  }

  ngAfterViewInit(): void {
    console.log('Step 2: AfterViewInit - Start shapefile download');
    if (this.chartContainer) {
      this.downloadShapefile();
    }

    this.blobSubject.pipe(
      mergeMap(blob => {
        console.log('Step 3: Blob received, extracting shapefile contents');
        const zip = new JSZip();
        return this.unzipFiles(zip, blob);
      }),
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error during unzipping:', error);
        return of(null);
      })
    ).subscribe(zip => {
      if (zip) {
        console.log('Step 4: Shapefile unzipped');
        this.unzipSubject.next(zip);
      }
    });

    this.unzipSubject.pipe(
      mergeMap(zip => {
        console.log('Step 5: Extracting .shp and .dbf files');
        return this.extractShapefile(zip);
      }),
      mergeMap(buffers => {
        if (buffers === null) {
          return of(null);
        }
        const [shpBuffer, dbfBuffer] = buffers;
        console.log('Step 6: Processing shapefile into GeoJSON');
        return this.processShapefile(shpBuffer, dbfBuffer);
      }),
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error processing shapefile:', error);
        return of(null);
      })
    ).subscribe(geojsonData => {
      if (geojsonData) {
        console.log('Step 7: GeoJSON processed, starting D3 map creation');
        this.createUSMap(geojsonData);
      }
    });
  }

  ngOnDestroy(): void {
    console.log('Component is being destroyed. Cleaning up subscriptions.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  downloadShapefile(): void {
    console.log('Step 2.1: Downloading shapefile');

    this.http.get(this.shapefileUrl, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error fetching shapefile:', error);
        return of(null);
      })
    ).subscribe(blob => {
      if (blob) {
        console.log('Step 2.2: Shapefile downloaded');
        this.blobSubject.next(blob);
      }
    });
  }

  unzipFiles(zip: JSZip, blob: Blob): Observable<JSZip> {
    return from(zip.loadAsync(blob));
  }

  extractShapefile(zip: JSZip): Observable<[ArrayBuffer, ArrayBuffer] | null> {
    const shpFile = zip.file(/\.shp$/)[0];
    const dbfFile = zip.file(/\.dbf$/)[0];

    if (!shpFile || !dbfFile) {
      return of(null);
    }

    return from(shpFile.async('arraybuffer')).pipe(
      mergeMap(shpBuffer => from(dbfFile.async('arraybuffer')).pipe(
        mergeMap(dbfBuffer => of([shpBuffer, dbfBuffer] as [ArrayBuffer, ArrayBuffer]))
      )),
      catchError(error => {
        console.error('Error extracting shapefile:', error);
        return of(null);
      })
    );
  }

  processShapefile(shpBuffer: ArrayBuffer, dbfBuffer: ArrayBuffer): Observable<GeoJSONCollection> {
    return from(shapefile.open(shpBuffer, dbfBuffer)).pipe(
      mergeMap(source => {
        const features: GeoJSON.Feature[] = [];

        return new Observable<GeoJSONCollection>(subscriber => {
          function readFeature() {
            from(source.read()).subscribe({
              next: (result: ShapefileResult) => {
                if (result.done) {
                  subscriber.next({ 
                    type: 'FeatureCollection', 
                    features 
                  });
                  subscriber.complete();
                } else if (result.value) {
                  features.push(result.value);
                  readFeature(); // Recursively process next feature
                }
              },
              error: (err: Error) => subscriber.error(err),
            });
          }

          readFeature(); // Start reading features
        });
      }),
      catchError(error => {
        console.error('Error processing shapefile:', error);
        return of({ 
          type: 'FeatureCollection' as const, 
          features: [] 
        });
      })
    );
  }

  createUSMap(geojsonData: GeoJSONCollection): void {
    console.log('Step 8: Creating D3 map visualization');
    const element = this.chartContainer?.nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;

    debugger
    const svgElement = this.renderer.createElement('svg', 'svg');
    this.renderer.setAttribute(svgElement, 'width', `${width}`);
    this.renderer.setAttribute(svgElement, 'height', `${height}`);
    this.renderer.appendChild(element, svgElement);

    const svg = d3.select<SVGSVGElement, unknown>(svgElement);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('class', 'title')
      .text('U.S. Map Visualization using D3.js v7');
    console.log('Step 8.1: Added title to the map');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 60)
      .attr('text-anchor', 'middle')
      .attr('class', 'description')
      .text('This map showcases improvements in D3.js v7, including better projection handling and performance optimizations.');
    console.log('Step 8.2: Added description to the map');

    const projection = d3.geoAlbersUsa()
      .scale(1200)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append('g');
    g.selectAll('path')
      .data(geojsonData.features)
      .enter()
      .append('path')
      .attr('d', (d: any) => path(d) as string)
      .attr('fill', '#69b3a2')
      .attr('stroke', 'black');
    console.log('Step 8.3: All states rendered');
  }
}
