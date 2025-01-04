import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar.component';
import { MaterialModule } from '../../material.module';
import { RouterLink } from '@angular/router';

@NgModule({
  declarations: [SidebarComponent],
  imports: [CommonModule, MaterialModule, RouterLink],
  exports: [SidebarComponent, MaterialModule],
})
export class SidebarModule {}
