import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header.component';

@NgModule({
  imports: [
    CommonModule,
    HeaderComponent,
    MaterialModule
  ],
  exports: [HeaderComponent]
})
export class HeaderModule { }
