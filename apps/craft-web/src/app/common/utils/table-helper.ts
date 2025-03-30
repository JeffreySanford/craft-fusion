import { AfterViewInit, ViewChild, Directive } from '@angular/core';
import { MatTable } from '@angular/material/table';

/**
 * Utility class to handle common MatTable operations and fixes
 * This helps with ensuring tables have proper row definitions and can be refreshed safely
 */
@Directive()
export class TableHelper<T> implements AfterViewInit {
  @ViewChild(MatTable) table!: MatTable<T>;
  
  /**
   * Force a redraw of the MatTable rows safely outside change detection
   */
  refreshTable(): void {
    if (this.table) {
      setTimeout(() => {
        this.table.renderRows();
      });
    }
  }
  
  /**
   * Initialize the table component after view initialization
   * This helps ensure proper rendering and prevents multiple default row errors
   */
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.table) {
        // Clear any cached row definitions before rendering
        if ((this.table as any)._rowOutlet && (this.table as any)._rowOutlet.viewContainer) {
          (this.table as any)._rowOutlet.viewContainer.clear();
        }
        this.table.renderRows();
      }
    });
  }
  
  /**
   * Apply to any component with MatTable to fix common issues
   * @param component The component containing MatTable
   */
  static fixTableDefinitions<T>(component: any): void {
    if (component.table) {
      setTimeout(() => {
        component.table.renderRows();
      });
    }
  }
}
