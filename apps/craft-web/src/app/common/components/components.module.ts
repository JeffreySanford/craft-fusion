import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ServerStatusComponent } from './server-status/server-status.component';

@NgModule({
  declarations: [
    ServerStatusComponent // Component must be non-standalone to be declared here
  ],
  imports: [
    CommonModule,
    MatButtonModule
  ],
  exports: [
    ServerStatusComponent
  ]
})
export class ComponentsModule { }
