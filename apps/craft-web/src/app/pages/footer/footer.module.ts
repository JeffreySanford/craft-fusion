import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [FooterComponent],
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatCardModule  ],
  exports: [FooterComponent]
})
export class FooterModule { }
