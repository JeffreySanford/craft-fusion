import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer.component';
import { MaterialModule } from '../../material.module';

@NgModule({
  declarations: [FooterComponent],
  imports: [
    CommonModule,
    MaterialModule,
  ],
  exports: []
})
export class FooterModule { }
