import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { MemorialTimelineModule } from './family/memorial-timeline/memorial-timeline.module';
import { DataVisualizationsModule } from './data-visualizations/data-visualizations.module';
import { BookModule } from './book/book.module';
import { ChatModule } from './chat/chat.module';
import { PeasantKitchenModule } from './peasant-kitchen/peasant-kitchen.module';
import { TableModule } from './table/table.module';
import { SpaceVideoModule } from './space-video/space-video.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MemorialTimelineModule,
    DataVisualizationsModule,
    BookModule,
    ChatModule,
    PeasantKitchenModule,
    TableModule,
    SpaceVideoModule
  ],
  declarations: [],
  exports: [
    MemorialTimelineModule,
    DataVisualizationsModule,
    BookModule,
    ChatModule,
    PeasantKitchenModule,
    TableModule,
    SpaceVideoModule
  ]
})
export class ProjectsModule { }
