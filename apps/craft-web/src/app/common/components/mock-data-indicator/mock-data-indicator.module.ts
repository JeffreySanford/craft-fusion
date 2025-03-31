import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MockDataIndicatorComponent } from './mock-data-indicator.component';

@NgModule({
  declarations: [MockDataIndicatorComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [MockDataIndicatorComponent]
})
export class MockDataIndicatorModule { }
