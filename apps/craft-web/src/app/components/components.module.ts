import { NgModule } from '@angular/core';                                  
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LoggerDisplayComponent } from './logger-display/logger-display.component';

@NgModule({
  declarations: [LoggerDisplayComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,

  ],
  exports: [LoggerDisplayComponent],

})
export class ComponentsModule {}
