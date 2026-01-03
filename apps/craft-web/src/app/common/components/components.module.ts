import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ServerStatusComponent } from './server-status/server-status.component';
import { BgColorDirective } from '../directives/bg-color.directive';
import { TextColorDirective } from '../directives/text-color.directive';
import { StyleDirective } from '../directives/style.directive';

@NgModule({
  declarations: [
    ServerStatusComponent,                                                        
    BgColorDirective,
    TextColorDirective,
    StyleDirective,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  exports: [ServerStatusComponent, BgColorDirective, TextColorDirective, StyleDirective],
})
export class ComponentsModule {}
