import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { MemorialTimelineModule } from './family/memorial-timeline/memorial-timeline.module';

// Import other project components as needed
// import { BookComponent } from './book/book.component';
// import { DataVisualizationsComponent } from './data-visualizations/data-visualizations.component';
// import { PeasantKitchenComponent } from './peasant-kitchen/peasant-kitchen.component';
// import { RecordListComponent } from './table/record-list.component';
// import { SpaceVideoComponent } from './space-video/space-video.component';

@NgModule({
  declarations: [
    // Add other project components here, but NOT the timeline components
    // since they're already declared in MemorialTimelineModule
    // BookComponent,
    // DataVisualizationsComponent,
    // PeasantKitchenComponent,
    // RecordListComponent,
    // SpaceVideoComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    // Import the MemorialTimelineModule instead of declaring its components
    MemorialTimelineModule
    // Add other required modules
  ],
  exports: [
    // Export MemorialTimelineModule to make its components available
    MemorialTimelineModule
    // Export other components as needed
  ]
})
export class ProjectsModule { }
