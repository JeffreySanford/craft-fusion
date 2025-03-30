import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { SettingsComponent } from './settings.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  declarations: [
    SettingsComponent  // This is now a non-standalone component
  ],
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatRadioModule
    // Removed PipesModule since we don't need it anymore
  ],
  exports: [
    SettingsComponent  // Export it for use in other modules
  ]
})
export class SettingsModule { }
