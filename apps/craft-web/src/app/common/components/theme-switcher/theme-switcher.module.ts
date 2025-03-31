import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeSwitcherComponent } from './theme-switcher.component';

@NgModule({
  declarations: [ThemeSwitcherComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [ThemeSwitcherComponent]
})
export class ThemeSwitcherModule { }
