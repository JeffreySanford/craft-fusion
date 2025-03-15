import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BarChartData, LineChartData, MapChartData, ChartData } from './data-visualizations.interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { YahooService } from '../../common/services/yahoo.service';
import moment from 'moment';
import { catchError } from 'rxjs/operators';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { SidebarStateService } from '../../common/services/sidebar-state.service';
import { ChartLayoutService } from './services/chart-layout.service';
import { MatDialog } from '@angular/material/dialog';
import { TileLimitDialogComponent } from './dialogs/tile-limit-dialog.component';

@Component({
  selector: 'app-data-visualizations',
  templateUrl: './data-visualizations.component.html',
  styleUrls: ['./data-visualizations.component.scss'],
  standalone: false,
})
export class DataVisualizationsComponent implements OnInit, OnDestroy {
  isMobile = false;
  isSidebarCollapsed = false;
  expandedTileIndex: number | null = null;
  fullExpandedTileIndex: number | null = null; // New property for full-screen expansion
  
  // Track displayed and available charts
  displayedCharts: ExtendedChartData[] = [];
  availableCharts: ExtendedChartData[] = [];
  private sidebarSubscription: Subscription;

  public barChartData: BarChartData[] = [
    {
      month: 'January',
      values: [
        { label: 'value1', amount: 150 },
        { label: 'value2', amount: 200 },
        { label: 'value3', amount: 180 },
      ],
    },
    {
      month: 'February',
      values: [
        { label: 'value1', amount: 200 },
        { label: 'value2', amount: 180 },
        { label: 'value3', amount: 220 },
      ],
    },
    {
      month: 'March',
      values: [
        { label: 'value1', amount: 250 },
        { label: 'value2', amount: 230 },
        { label: 'value3', amount: 210 },
      ],
    },
  ];

  public lineChartData: LineChartData[] = [
    { date: new Date('2024-01-01'), series1: 500, series2: 3000, series3: 7000 },
    { date: new Date('2024-02-01'), series1: 1500, series2: 6200, series3: 6800 },
    { date: new Date('2024-03-01'), series1: 5800, series2: 6400, series3: 7200 },
    { date: new Date('2024-04-01'), series1: 6000, series2: 6600, series3: 7400 },
    { date: new Date('2024-05-01'), series1: 6200, series2: 6800, series3: 7600 },
    { date: new Date('2024-06-01'), series1: 6400, series2: 7000, series3: 7800 },
    { date: new Date('2024-07-01'), series1: 6600, series2: 7200, series3: 8000 },
    { date: new Date('2024-08-01'), series1: 6800, series2: 7400, series3: 8200 },
    { date: new Date('2024-09-01'), series1: 7000, series2: 7600, series3: 8400 },
    { date: new Date('2024-10-01'), series1: 7200, series2: 7800, series3: 8600 },
    { date: new Date('2024-11-01'), series1: 7400, series2: 8000, series3: 8800 },
    { date: new Date('2024-12-01'), series1: 7600, series2: 8200, series3: 9000 },
  ];

  // Master list of all chart data
  public allCharts: ExtendedChartData[] = [
    { name: 'Line Chart', component: 'app-line-chart', color: 'dodgerblue', data: this.lineChartData, size: 'small' },
    { name: 'Bar Chart', component: 'app-bar-chart', color: 'limegreen', data: this.barChartData, size: 'small' },
    { name: 'Quantum Fisher Information', component: 'app-quantum-fisher-tile', color: 'mediumpurple', data: [], size: 'large' },
    { name: 'FinTech Chart', component: 'app-finance-chart', color: 'tomato', data: [], size: 'medium' },
    { name: 'Fire Alert Chart', component: 'app-fire-alert', color: 'orange', data: [], size: 'large' }, // Changed from 'small' to 'large'
  ];

  public fintechChartData: any[] = [];
  financeData: any;

  // New properties to track dimensions
  tileWidth: number = 0;
  tileHeight: number = 0;
  resizeObserver: ResizeObserver | null = null;

  // Add new property to track the maximum number of tiles allowed
  readonly MAX_TILES = 5;

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private cdr: ChangeDetectorRef, 
    private yahooService: YahooService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private sidebarStateService: SidebarStateService,
    private chartLayoutService: ChartLayoutService,
    private dialog: MatDialog
  ) {
    // Register icons - this ensures Material icons are available
    this.registerIcons();
    
    // Initialize available and displayed charts
    this.availableCharts = [...this.allCharts];
    
    // By default, only show the Fire Alert tile
    const fireAlertIndex = this.availableCharts.findIndex(chart => chart.component === 'app-fire-alert');
    if (fireAlertIndex !== -1) {
      // Create a copy to avoid reference issues
      const fireAlertChart = { ...this.availableCharts[fireAlertIndex] };
      // Set special layout to ensure it's full width as the default
      fireAlertChart.specialLayout = 'large-tile-full-width';
      this.displayedCharts = [fireAlertChart];
      this.optimizeChartLayout(); // Apply layout optimization
    }
    
    this.loadFintechChartData()
      .pipe()
      .subscribe(data => {
        this.fintechChartData = data;
        
        // Update finance chart data in both arrays
        const financeChartIndex = this.availableCharts.findIndex(c => c.component === 'app-finance-chart');
        if (financeChartIndex !== -1) {
          this.availableCharts[financeChartIndex].data = this.fintechChartData;
        }
        
        const displayedFinanceIndex = this.displayedCharts.findIndex(c => c.component === 'app-finance-chart');
        if (displayedFinanceIndex !== -1) {
          this.displayedCharts[displayedFinanceIndex].data = this.fintechChartData;
        }
        
        this.cdr.detectChanges();
      });

    // Subscribe to sidebar state changes
    this.sidebarSubscription = this.sidebarStateService.isCollapsed$.subscribe(
      isCollapsed => {
        this.isSidebarCollapsed = isCollapsed;
        this.cdr.detectChanges();
      }
    );
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      this.cdr.detectChanges();
    });

    // Setup resize observer to track container dimensions
    this.setupResizeObserver();

    // Ensure charts render properly by triggering resize after init
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Ensure body overflow is restored
    document.body.style.overflow = '';
  }

  // Setup resize observer to track tile dimensions
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.contentBoxSize) {
            // Handle modern browsers
            const contentBoxSize = Array.isArray(entry.contentBoxSize) ? 
              entry.contentBoxSize[0] : entry.contentBoxSize;
            
            this.tileWidth = contentBoxSize.inlineSize;
            this.tileHeight = contentBoxSize.blockSize;
          } else {
            // Fallback for older browsers
            this.tileWidth = entry.contentRect.width;
            this.tileHeight = entry.contentRect.height;
          }
          this.cdr.detectChanges();
        }
      });

      // Start observing after a short delay to ensure DOM is ready
      setTimeout(() => {
        const container = document.querySelector('.visualization-container');
        if (container) {
          this.resizeObserver!.observe(container);
        }
      }, 200);
    }
  }

  // Calculate dimensions for each tile based on its size property and container size
  getTileDimensions(chart: ChartData): { width: number, height: number } {
    const baseHeight = chart.size === 'small' ? 250 : 
                       chart.size === 'large' ? 450 : 350;
    
    return {
      width: 0, // Will be determined by container
      height: baseHeight
    };
  }

  // Check if a chart is currently displayed
  isChartActive(chart: ChartData): boolean {
    return this.displayedCharts.some(c => c.component === chart.component);
  }

  // Toggle a chart between displayed and not displayed
  toggleChart(chart: ChartData, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isChartActive(chart)) {
      this.removeTile(chart);
    } else {
      this.addTile(chart);
    }
    
    // Update all list items to have proper styling
    setTimeout(() => {
      this.updateListItemStyles();
    });
  }

  // Check if there's still room to add more tiles
  hasRoomForMoreTiles(newTile: ChartData): boolean {
    // Count existing tiles by size
    const largeCount = this.displayedCharts.filter(c => c.size === 'large').length;
    const mediumCount = this.displayedCharts.filter(c => c.size === 'medium').length;
    const smallCount = this.displayedCharts.filter(c => c.size === 'small').length;
    
    console.log(`Current tile counts: ${largeCount} large, ${mediumCount} medium, ${smallCount} small`);
    
    // Rule 1: Two large tiles maximum and they can't be mixed with other sizes
    if (largeCount > 0) {
      // If we already have large tiles
      if (largeCount >= 2) {
        // Already at max of 2 large tiles
        return false;
      }
      if (newTile.size !== 'large') {
        // Can't mix large with other sizes
        return false;
      }
      return true; // Can add a second large tile
    }
    
    // Rule 2: If adding a large tile when other sizes exist
    if (newTile.size === 'large' && (mediumCount > 0 || smallCount > 0)) {
      return false; // Can't add large when medium/small exist
    }
    
    // Rule 3: Medium tile scenarios
    if (newTile.size === 'medium') {
      // Up to 4 medium tiles in a 2x2 grid
      if (mediumCount >= 4) {
        return false;
      }
      
      // Medium + Small combinations
      // Maximum would be 2 medium + 1 small (2*6 + 1*4 = 16 columns across 2 rows)
      if (mediumCount >= 2 && smallCount >= 1) {
        return false;
      }
      
      // Up to 2 medium tiles with 2 small tiles (2*6 + 2*4 = 20 columns < 24 in 2 rows)
      if (smallCount >= 3) {
        return false;
      }
      
      return true;
    }
    
    // Rule 4: Small tile scenarios
    if (newTile.size === 'small') {
      // 6 small tiles max in two rows of 3 (6*4 = 24 columns total)
      if (smallCount >= 6) {
        return false;
      }
      
      // With 2 medium tiles, only allow up to 2 small tiles (2*6 + 2*4 = 20 columns < 24)
      if (mediumCount === 2 && smallCount >= 2) {
        return false;
      }
      
      // With 3 medium tiles, allow 0 small tiles (3*6 = 18 columns, no room for small in 2 rows)
      if (mediumCount >= 3) {
        return false;
      }
      
      return true;
    }
    
    return false; // Default case for unknown sizes
  }

  getChartClasses(chart: ChartData): string {
    // Return the pre-calculated chart class if available
    return this.calculateChartClass(chart.component);
  }

  // Add tile to the main display with improved grid positioning
  addTile(chart: ChartData): void {
    console.log('Adding tile:', chart.name, chart.size);
    
    // Check if there's room for more tiles
    if (!this.hasRoomForMoreTiles(chart)) {
      // Show dialog that allows for removing tiles
      this.showNoSpaceNotification(chart as ExtendedChartData);
      return;
    }
    
    // Clone the chart to avoid reference issues
    const chartCopy = { ...chart } as ExtendedChartData;
    
    // Pre-calculate the chart class
    chartCopy.chartClass = this.chartLayoutService.calculateChartClass(chartCopy.component);
    
    // Insert large tiles at the beginning for optimal grid layout
    if (chartCopy.size === 'large') {
      this.displayedCharts.unshift(chartCopy);
    } else {
      this.displayedCharts.push(chartCopy);
    }
    
    // Sort charts by size to optimize layout (large first, then medium, then small)
    this.optimizeChartLayout();
    
    this.cdr.detectChanges();
    
    console.log('Current layout:', this.displayedCharts.map(c => `${c.name} (${c.size})`));
    
    // Ensure proper rendering with slight delay to allow DOM updates
    setTimeout(() => {
      this.resizeCharts();
    }, 150);
  }

  // Show notification that there's no more room for tiles
  private showNoSpaceNotification(newTile: ExtendedChartData): void {
    const dialogRef = this.dialog.open(TileLimitDialogComponent, {
      width: '500px',
      panelClass: 'patriotic-dialog',
      disableClose: true,
      data: {
        currentTiles: this.displayedCharts,
        newTile: newTile
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'remove' && result.tiles && result.tiles.length > 0) {
        // Remove the selected tiles
        result.tiles.forEach((tile: ExtendedChartData) => {
          this.removeTile(tile);
        });
        
        // Add the new tile after a short delay
        setTimeout(() => {
          this.addTile(newTile);
        }, 300);
      }
    });
  }

  // Optimize the chart layout by size for better grid arrangement
  private optimizeChartLayout(): void {
    this.displayedCharts = this.chartLayoutService.optimizeChartLayout(this.displayedCharts);
  }

  // Remove a tile from the main display
  removeTile(chart: ChartData, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.displayedCharts.findIndex(c => c.component === chart.component);
    if (index !== -1) {
      this.displayedCharts.splice(index, 1);
      this.cdr.detectChanges();
      
      // Trigger resize for remaining charts
      setTimeout(() => {
        this.resizeCharts();
      }, 150);
    }
  }

  openTile(index: number) {
    // Toggle expanded state
    this.expandedTileIndex = this.expandedTileIndex === index ? null : index;

    // Ensure visualization renders properly when expanded
    if (this.expandedTileIndex !== null) {
      setTimeout(() => {
        this.resizeCharts();
      }, 150);
    }
  }

  drop(event: CdkDragDrop<ExtendedChartData[]>) {
    moveItemInArray(this.displayedCharts, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();
    
    // Resize charts after reordering
    setTimeout(() => {
      this.resizeCharts();
    }, 150);
  }

  // Get an appropriate icon for each chart type
  getIconForChart(chart: ChartData): string {
    switch (chart.component) {
      case 'app-line-chart': return 'show_chart';
      case 'app-bar-chart': return 'bar_chart';
      case 'app-finance-chart': return 'trending_up';
      case 'app-fire-alert': return 'warning';
      case 'app-quantum-fisher-tile': return 'science';
      default: return 'widgets';
    }
  }

  private loadFintechChartData(): Observable<any> {
    const stockSymbols = ['AAPL', 'GOOGL', 'MSFT']; // Add more stock symbols as needed
    const endDate = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(1, 'years').format('YYYY-MM-DD');

    return this.yahooService.getHistoricalData(stockSymbols, '1d', '1y').pipe(
      catchError(error => {
        console.error(`Error loading data for ${stockSymbols}:`, error);
        return of([]);
      }),
    );
  }

  // Add method to handle tile size classes
  getTileSize(size: string | undefined): string {
    return `size-${size || 'medium'}`;
  }

  // Register Material Icons
  private registerIcons(): void {
    // This ensures that Material icons are properly loaded
    this.iconRegistry.setDefaultFontSetClass('material-icons');
  }

  // Add method to update list item styles
  updateListItemStyles(): void {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const listItems = document.querySelectorAll('.visualization-sidebar mat-list-item');
      
      listItems.forEach((item, index) => {
        const chart = this.availableCharts[index];
        if (this.isChartActive(chart)) {
          // Apply chart color to the border, text, and icons
          (item as HTMLElement).style.borderLeftColor = chart.color;
          (item as HTMLElement).style.color = chart.color;
          
          // Ensure checkbox icon gets the color as well
          const checkboxIcon = item.querySelector('mat-icon[matListItemMeta]');
          if (checkboxIcon) {
            (checkboxIcon as HTMLElement).style.color = chart.color;
          }
        } else {
          // Reset styles for inactive items
          (item as HTMLElement).style.borderLeftColor = '';
          (item as HTMLElement).style.color = '';
          
          const checkboxIcon = item.querySelector('mat-icon[matListItemMeta]');
          if (checkboxIcon) {
            (checkboxIcon as HTMLElement).style.color = '';
          }
        }
      });
    });
  }
  
  ngAfterViewInit() {
    // Initialize list item styles after view is initialized
    this.updateListItemStyles();
    
    // ...existing code...
  }

  toggleVisualizationSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.cdr.detectChanges();
    
    // Ensure proper rendering
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  // New method to trigger resize on all charts
  resizeCharts(): void {
    // Force re-layout first
    this.cdr.detectChanges();
    
    // Then dispatch resize event
    window.dispatchEvent(new Event('resize'));
    
    // Then run another change detection cycle
    this.cdr.detectChanges();
    
    // For components that might need a second resize after initial layout
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      this.cdr.detectChanges();
    }, 100);
  }

  // Replace the old getChartContentClass method with this improved version
  getChartClass(chart: ExtendedChartData): string {
    if (!chart.chartClass) {
      // If not pre-calculated, calculate it now and cache it
      chart.chartClass = this.chartLayoutService.calculateChartClass(chart.component);
    }
    
    return chart.chartClass;
  }

  // Calculate chart class based on component type - only called when needed
  private calculateChartClass(componentType: string): string {
    return this.chartLayoutService.calculateChartClass(componentType);
  }

  // Handle tile click for expansion or collapse
  handleTileClick(index: number, event: MouseEvent): void {
    // Ignore if clicking on buttons or interactive elements
    if (
      (event.target as HTMLElement).closest('button') || 
      (event.target as HTMLElement).closest('mat-slider') ||
      (event.target as HTMLElement).closest('mat-checkbox') ||
      (event.target as HTMLElement).closest('mat-select')
    ) {
      return;
    }
    
    // If already in full-screen, do nothing (use restore button to exit)
    if (this.fullExpandedTileIndex !== null) {
      return;
    }
    
    // If already partially expanded, go to full-screen
    if (this.expandedTileIndex === index) {
      this.fullExpandedTile(index);
    } else {
      // Otherwise just expand partially
      this.openTile(index);
    }
  }
  
  // Expand tile to full-screen
  fullExpandedTile(index: number): void {
    this.fullExpandedTileIndex = index;
    
    // Apply body styles to prevent scrolling of background
    document.body.style.overflow = 'hidden';
    
    // Ensure proper rendering in full-screen mode with more time
    // to allow the transitions to complete before resizing charts
    setTimeout(() => {
      this.resizeCharts();
    }, 300);
  }
  
  // Restore tile from full-screen
  restoreTile(index: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.fullExpandedTileIndex = null;
    
    // Restore body overflow
    document.body.style.overflow = '';
    
    // Ensure proper rendering after restore with more time
    setTimeout(() => {
      this.resizeCharts();
    }, 300);
  }
  
  // Handle clicks on the backdrop to restore from full-screen
  handleBackdropClick(event: MouseEvent): void {
    // Only respond if clicking directly on the backdrop
    if ((event.target as HTMLElement).classList.contains('fullscreen-backdrop')) {
      this.restoreTile(this.fullExpandedTileIndex!);
    }
  }

  // Get CSS classes for each tile based on its properties
  getTileClasses(chart: ExtendedChartData, index: number): string {
    const classes = [this.getTileSize(chart.size)];
    
    if (chart.component === 'app-line-chart') classes.push('chart-type-line');
    if (chart.component === 'app-bar-chart') classes.push('chart-type-bar');
    if (chart.component === 'app-finance-chart') classes.push('chart-type-finance');
    
    if (this.expandedTileIndex === index) classes.push('expanded');
    if (this.fullExpandedTileIndex === index) classes.push('full-expanded');
    
    // Add special positioning classes based on size and position
    if (chart.size === 'small') {
      if (chart.position === 0) classes.push('small-tile-first-row');
      if (chart.position === 1) classes.push('small-tile-first-row');
      if (chart.position === 2) classes.push('small-tile-third');
      if (chart.position && chart.position > 2) classes.push('small-tile-other');
    }
    
    // Add special layout classes for large tiles
    if (chart.specialLayout) {
      classes.push(chart.specialLayout);
    }
    
    if (chart.specialPosition) {
      classes.push('special-position');
    }
    
    return classes.join(' ');
  }
}

// Update the ChartData interface to include a chartClass property
export interface ExtendedChartData extends ChartData {
  chartClass?: string; // Store the pre-calculated chart class
  position?: number; // Track position in the grid
  specialPosition?: boolean; // Flag for special positioning
  specialLayout?: string; // Store special layout class names
}
