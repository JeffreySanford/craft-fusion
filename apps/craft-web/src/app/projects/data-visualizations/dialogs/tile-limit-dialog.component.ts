import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExtendedChartData } from '../data-visualizations.component';

@Component({
  selector: 'app-tile-limit-dialog',
  templateUrl: './tile-limit-dialog.component.html',
  styleUrls: ['./tile-limit-dialog.component.scss'],
  standalone: false
})
export class TileLimitDialogComponent implements OnInit {
  selectedTilesToRemove: Set<string> = new Set();
  newTile: ExtendedChartData;

  constructor(
    public dialogRef: MatDialogRef<TileLimitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      currentTiles: ExtendedChartData[],
      newTile: ExtendedChartData
    }
  ) {
    this.newTile = data.newTile;
  }

  ngOnInit(): void {
    // Initialize component
  }

  /**
   * Toggle selection of a tile for removal
   */
  toggleTileSelection(tile: ExtendedChartData): void {
    const id = `${tile.component}_${tile.name}`;
    if (this.selectedTilesToRemove.has(id)) {
      this.selectedTilesToRemove.delete(id);
    } else {
      this.selectedTilesToRemove.add(id);
    }
  }

  /**
   * Check if a tile is selected for removal
   */
  isTileSelected(tile: ExtendedChartData): boolean {
    return this.selectedTilesToRemove.has(`${tile.component}_${tile.name}`);
  }

  /**
   * Get icon for a chart
   */
  getIconForChart(chart: ExtendedChartData): string {
    switch (chart.component) {
      case 'app-line-chart': return 'show_chart';
      case 'app-bar-chart': return 'bar_chart';
      case 'app-finance-chart': return 'trending_up';
      case 'app-fire-alert': return 'warning';
      case 'app-quantum-fisher-tile': return 'science';
      default: return 'widgets';
    }
  }

  /**
   * Confirm selection and close dialog
   */
  confirmSelection(): void {
    const tilesToRemove = this.data.currentTiles.filter(tile => 
      this.selectedTilesToRemove.has(`${tile.component}_${tile.name}`)
    );
    this.dialogRef.close({ action: 'remove', tiles: tilesToRemove });
  }

  /**
   * Cancel and close dialog
   */
  cancelDialog(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  /**
   * Get size label
   */
  getTileSizeLabel(size: string): string {
    switch(size) {
      case 'small': return 'Small';
      case 'medium': return 'Medium';
      case 'large': return 'Large';
      default: return 'Standard';
    }
  }

  /**
   * Get space needed text
   */
  getSpaceNeededText(): string {
    let text = 'You need to free up space to add this ';
    text += this.getTileSizeLabel(this.newTile.size ?? 'standard').toLowerCase();
    text += ' tile. Select tiles to remove:';
    return text;
  }
}
