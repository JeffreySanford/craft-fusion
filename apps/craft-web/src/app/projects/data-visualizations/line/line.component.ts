import { Component, Input } from '@angular/core';
import { LineChartData } from '../data-visualizations.interfaces';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],

})
export class LineComponent {
  @Input() data: LineChartData[] | undefined;
}
