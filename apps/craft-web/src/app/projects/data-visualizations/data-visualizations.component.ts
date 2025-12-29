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
import { SocketClientService } from '../../common/services/socket-client.service';
import { active } from 'd3';

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
    { name: 'Line Chart', component: 'app-line-chart', color: 'dodgerblue', data: this.lineChartData, size: 'medium', active: true },
    { name: 'Bar Chart', component: 'app-bar-chart', color: 'limegreen', data: this.barChartData, size: 'medium', active: true },
    { name: 'FinTech Chart', component: 'app-finance-chart', color: 'tomato', data: [], size: 'medium', active: false },
    { name: 'Fire Alert Chart', component: 'app-fire-alert', color: 'orange', data: [], size: 'large', active: false },
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
    private dialog: MatDialog,
    private socketClient: SocketClientService
  ) {
    console.log('DataVisualizationsComponent instantiated');
    // Register icons - this ensures Material icons are available
    this.registerIcons();
    
    // Initialize available and displayed charts
    this.availableCharts = [...this.allCharts];
    
    
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
        
        setTimeout(() => this.cdr.detectChanges());
      });

    // Listen for real-time updates
    this.socketClient.on<any>('yahoo:data').subscribe(data => {
      // Update chart data in real-time
      this.fintechChartData = data;
      setTimeout(() => this.cdr.detectChanges());
    });

    // Subscribe to sidebar state changes
    this.sidebarSubscription = this.sidebarStateService.isCollapsed$.subscribe(
      isCollapsed => {
        this.isSidebarCollapsed = isCollapsed;
        setTimeout(() => this.cdr.detectChanges());
      }
    );
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      setTimeout(() => this.cdr.detectChanges());
    });

    // Setup resize observer to track container dimensions
    this.setupResizeObserver();

    // Ensure charts render properly by triggering resize after init
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);

    this.allCharts.forEach(chart => {
      // if line and bar chart, mark active, else turn off initially
      if (chart.component === 'app-line-chart' || chart.component === 'app-bar-chart') {
        chart.active = true;
      } else {
        chart.active = false;
      }
      // Set default size if not provided
      if (!chart.size) {
        chart.size = 'medium';
      }
      // Set default position if not provided
      if (!chart.position) {
        chart.position = 0;
      }
      // Pre-calculate chart classes for each chart
      chart.chartClass = this.chartLayoutService.calculateChartClass(chart.component);
    });

    this.displayedCharts = this.allCharts.filter(chart => chart.active);
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
    if (!newTile || !newTile.size) {
      console.warn('Invalid tile data provided to hasRoomForMoreTiles');
      return false;
    }

    // Count existing tiles by size - ensure we have the latest state
    const largeCount = this.displayedCharts.filter(c => c.size === 'large').length;
    const mediumCount = this.displayedCharts.filter(c => c.size === 'medium').length;
    const smallCount = this.displayedCharts.filter(c => c.size === 'small').length;
    
    console.log(`Checking space - Current tile counts: ${largeCount} large, ${mediumCount} medium, ${smallCount} small`);
    console.log(`Attempting to add: ${newTile.name} (${newTile.size})`);
    
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
        // Store reference to removed tiles for debugging
        const removedTileNames = result.tiles.map((t: ExtendedChartData) => t.name);
        console.log(`Removing tiles: ${removedTileNames.join(', ')}`);
        
        // Remove the selected tiles one by one
        result.tiles.forEach((tile: ExtendedChartData) => {
          this.removeTile(tile, undefined, false); // Don't trigger resize yet
        });
        
        // Force a complete refresh of the layout
        this.optimizeChartLayout();
        setTimeout(() => this.cdr.detectChanges());
        
        console.log('After removal - checking space again');
        // Log current state for debugging
        const currentState = {
          largeCount: this.displayedCharts.filter(c => c.size === 'large').length,
          mediumCount: this.displayedCharts.filter(c => c.size === 'medium').length,
          smallCount: this.displayedCharts.filter(c => c.size === 'small').length
        };
        console.log(`Current state: ${JSON.stringify(currentState)}`);
        
        // Use a longer timeout to ensure state is fully updated
        setTimeout(() => {
          // Verify there is now enough space before adding
          const hasRoom = this.hasRoomForMoreTiles(newTile);
          console.log(`Has room for new tile? ${hasRoom}`);
          
          if (hasRoom) {
            this.addTile(newTile);
          } else {
            console.warn('Still not enough space after removals. Adding anyway as user explicitly made space.');
            // Force add since user has explicitly made room by removing tiles
            this.forceAddTile(newTile);
          }
        }, 150); // Longer delay to ensure complete update
      }
    });
  }

  // Force add a tile even if space check fails
  private forceAddTile(chart: ExtendedChartData): void {
    console.log('Force adding tile:', chart.name);
    
    // Clone the chart to avoid reference issues
    const chartCopy = { ...chart } as ExtendedChartData;
    
    // Pre-calculate the chart class
    chartCopy.chartClass = this.chartLayoutService.calculateChartClass(chartCopy.component);
    
    // Insert large tiles at the beginning for optimal grid layout
    if (chartCopy.size === 'large') {
      this.displayedCharts.unshift(chartCopy);
      console.log('Added large tile to the beginning of the array');
    } else {
      this.displayedCharts.push(chartCopy);
      console.log('Added non-large tile to the end of the array');
    }
    
    // Optimize layout after adding
    this.optimizeChartLayout();
    setTimeout(() => {
      this.resizeCharts();
    }, 150);
  }

  // Optimize the chart layout by size for better grid arrangement
  private optimizeChartLayout(): void {
    this.displayedCharts = this.chartLayoutService.optimizeChartLayout(this.displayedCharts);
  }

  // Remove a tile from the main display
  removeTile(chart: ChartData, event?: MouseEvent, triggerResize: boolean = true): void {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.displayedCharts.findIndex(c => c.component === chart.component);
    if (index !== -1) {
      console.log(`Removing tile: ${chart.name}, index: ${index}`);
      this.displayedCharts.splice(index, 1);
      setTimeout(() => this.cdr.detectChanges());
      
      // Optionally skip resize for bulk operations
      if (triggerResize) {
        setTimeout(() => {
          this.resizeCharts();
        }, 150);
      }
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
    setTimeout(() => this.cdr.detectChanges());
    
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
    
    // Make sure icons are loaded properly
    const matIconsUrl = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    
    // Register the Material Icons font
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = matIconsUrl;
    document.head.appendChild(linkEl);
    
    // Ensure the registry knows about the material icons font set
    this.iconRegistry.registerFontClassAlias('material-icons');
  }

  // Update method to enhance list item styles with more vibrant colors
  updateListItemStyles(): void {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const listItems = document.querySelectorAll('.visualization-sidebar mat-list-item');
      
      listItems.forEach((item, index) => {
        const chart = this.availableCharts[index];
        if (this.isChartActive(chart)) {
          // Apply vibrant chart color to the border, text, and icons
          (item as HTMLElement).style.borderLeftColor = chart.color;
          (item as HTMLElement).style.color = chart.color;
          
          // Add glow effect with the chart color
          (item as HTMLElement).style.boxShadow = `0 0 10px rgba(${this.hexToRgb(chart.color)}, 0.3)`;
          
          // Add active class
          item.classList.add('active');
          
          // Find and style all icons in the active item
          const icons = item.querySelectorAll('mat-icon');
          icons.forEach(icon => {
            (icon as HTMLElement).style.color = chart.color;
            (icon as HTMLElement).style.filter = `drop-shadow(0 0 5px ${chart.color})`;
          });
          
          // Style the title text with glow
          const titleText = item.querySelector('[matListItemTitle]');
          if (titleText) {
            (titleText as HTMLElement).style.color = chart.color;
            (titleText as HTMLElement).style.textShadow = `0 0 5px rgba(${this.hexToRgb(chart.color)}, 0.5)`;
          }
        } else {
          // Reset styles for inactive items
          item.classList.remove('active');
          (item as HTMLElement).style.borderLeftColor = 'transparent';
          (item as HTMLElement).style.color = '';
          (item as HTMLElement).style.boxShadow = '';
          
          // Reset all icon colors and effects
          const icons = item.querySelectorAll('mat-icon');
          icons.forEach(icon => {
            (icon as HTMLElement).style.color = '';
            (icon as HTMLElement).style.filter = '';
          });
          
          // Reset title text color and glow
          const titleText = item.querySelector('[matListItemTitle]');
          if (titleText) {
            (titleText as HTMLElement).style.color = '';
            (titleText as HTMLElement).style.textShadow = '';
          }
        }
      });
    });
  }
  
  // Helper function to convert hex color to RGB
  private hexToRgb(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle shorthand hex
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }
  
  ngAfterViewInit() {
    // Initialize list item styles after view is initialized
    this.updateListItemStyles();
    
    // Add this to make sure icons render correctly
    setTimeout(() => {
      // Force re-render of icons
      document.querySelectorAll('mat-icon').forEach(icon => {
        icon.classList.add('material-icons');
      });
    }, 100);
  }

  toggleVisualizationSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    setTimeout(() => this.cdr.detectChanges());
    
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
    
    // Add special row class if present
    if (chart.specialRow) {
      classes.push(chart.specialRow);
    }
    
    return classes.join(' ');
  }
}

// Update the ChartData interface to include a chartClass property
export interface ExtendedChartData extends ChartData {
  chartClass?: string;        // Store the pre-calculated chart class
  position?: number;          // Track position in the grid
  specialPosition?: boolean;  // Flag for special positioning
  specialLayout?: string;     // Store special layout class names
  specialRow?: string;        // Track which row the tile belongs to for grid layouts
}