import { Component, Input } from '@angular/core';
import { FintechChartData } from '../data-visualizations.interfaces';

@Component({
  selector: 'app-fintech-chart',
  standalone: false,
  templateUrl: './fintech.component.html',
  styleUrls: ['./fintech.component.scss']
})
export class FintechComponent {
  @Input() data: FintechChartData[] | undefined;
}
