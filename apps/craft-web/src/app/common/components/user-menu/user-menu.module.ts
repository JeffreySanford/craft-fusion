import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from './user-menu.component';

@NgModule({
  declarations: [UserMenuComponent],
  imports: [CommonModule, MatMenuModule, MatIconModule, MatButtonModule],
  exports: [UserMenuComponent]
})
export class UserMenuModule {}
