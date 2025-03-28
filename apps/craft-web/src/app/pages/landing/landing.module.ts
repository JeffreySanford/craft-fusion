import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LandingComponent } from './landing.component';
import { MaterialIconsComponent } from './material-icons/material-icons.component';
import { MaterialButtonsComponent } from './material-buttons/material-buttons.component';
import { MaterialAnimationsComponent } from './material-animations/material-animations.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    LandingComponent,
    MaterialIconsComponent,
    MaterialButtonsComponent,
    MaterialAnimationsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  exports: [
    LandingComponent,
    MaterialIconsComponent,
    MaterialButtonsComponent,
    MaterialAnimationsComponent
  ]
})
export class LandingModule { }
