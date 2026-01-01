import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './header.component';
import { MatMenuModule } from '@angular/material/menu';                        
import { MatButtonModule } from '@angular/material/button';                          

@NgModule({
  declarations: [HeaderComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,                          
    MatButtonModule,                                           
  ],
  exports: [HeaderComponent],
})
export class HeaderModule {}
