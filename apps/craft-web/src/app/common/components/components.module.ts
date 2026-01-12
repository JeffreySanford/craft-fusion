import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { ServerStatusComponent } from './server-status/server-status.component';
import { ToasterComponent } from './toaster/toaster.component';
import { SecurityReportModalComponent } from './security-report-modal/security-report-modal.component';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { SpinnerDirective } from '../directives/spinner.directive';
import { NonD3ChartComponent } from '../charts/non-d3-chart.component';

@NgModule({
  declarations: [
    ServerStatusComponent,
    SafeHtmlPipe
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ToasterComponent,
    SpinnerDirective,
    SecurityReportModalComponent,
    NonD3ChartComponent
  ],
  exports: [
    ServerStatusComponent,
    ToasterComponent,
    SafeHtmlPipe,
    SpinnerDirective,
    SecurityReportModalComponent,
    NonD3ChartComponent
  ]
})
export class ComponentsModule { }
