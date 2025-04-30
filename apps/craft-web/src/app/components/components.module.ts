import { NgModule } from '@angular/core'; // Removed CUSTOM_ELEMENTS_SCHEMA
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
// Import other necessary modules here, e.g., MaterialModule if needed

import { LoggerDisplayComponent } from './logger-display/logger-display.component';

@NgModule({
  declarations: [
    LoggerDisplayComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule
    // Add other imported modules here
  ],
  exports: [
    LoggerDisplayComponent
  ],
  // schemas: [CUSTOM_ELEMENTS_SCHEMA] // REMOVE THIS LINE
})
export class ComponentsModule { }