import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceComponent } from './finance.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  declarations: [
    FinanceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule
  ],
  exports: [
    FinanceComponent
  ]
})
export class FinanceModule { }
