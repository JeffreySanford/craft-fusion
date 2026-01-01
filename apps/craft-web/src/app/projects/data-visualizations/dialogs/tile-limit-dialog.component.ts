import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExtendedChartData } from '../data-visualizations.component';

@Component({
  selector: 'app-tile-limit-dialog',
  templateUrl: './tile-limit-dialog.component.html',
  styleUrls: ['./tile-limit-dialog.component.scss'],
  standalone: false,
})
export class TileLimitDialogComponent implements OnInit {
  selectedTilesToRemove: Set<string> = new Set();
  newTile: ExtendedChartData;

  constructor(
    public dialogRef: MatDialogRef<TileLimitDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      currentTiles: ExtendedChartData[];
      newTile: ExtendedChartData;
    },
  ) {
    this.newTile = data.newTile;
  }

  ngOnInit(): void {

  }

  toggleTileSelection(tile: ExtendedChartData): void {
    const id = `${tile.component}_${tile.name}`;
    if (this.selectedTilesToRemove.has(id)) {
      this.selectedTilesToRemove.delete(id);
    } else {
      this.selectedTilesToRemove.add(id);
    }
  }

  isTileSelected(tile: ExtendedChartData): boolean {
    return this.selectedTilesToRemove.has(`${tile.component}_${tile.name}`);
  }

  getIconForChart(chart: ExtendedChartData): string {
    switch (chart.component) {
      case 'app-line-chart':
        return 'show_chart';
      case 'app-bar-chart':
        return 'bar_chart';
      case 'app-finance-chart':
        return 'trending_up';
      case 'app-fire-alert':
        return 'warning';
      default:
        return 'widgets';
    }
  }

  confirmSelection(): void {
    const tilesToRemove = this.data.currentTiles.filter(tile => this.selectedTilesToRemove.has(`${tile.component}_${tile.name}`));
    this.dialogRef.close({ action: 'remove', tiles: tilesToRemove });
  }

  cancelDialog(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  getTileSizeLabel(size: string): string {
    switch (size) {
      case 'small':
        return 'Small';
      case 'medium':
        return 'Medium';
      case 'large':
        return 'Large';
      default:
        return 'Standard';
    }
  }

  getSpaceNeededText(): string {
    let text = 'You need to free up space to add this ';
    text += this.getTileSizeLabel(this.newTile.size || 'standard').toLowerCase();
    text += ' tile. Select tiles to remove:';
    return text;
  }
}
