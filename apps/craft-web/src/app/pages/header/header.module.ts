import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  declarations: [HeaderComponent],
  imports: [
    CommonModule,
    RouterModule, // Ensure RouterModule is imported
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatRadioModule
  ],
  exports: [HeaderComponent]
})
export class HeaderModule { }
