import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header.component';
import { MaterialModule } from '@craft-web/material.module';

@NgModule({
  imports: [
    CommonModule,
    HeaderComponent,
    MaterialModule
  ],
  exports: [HeaderComponent]
})
export class HeaderModule { }
