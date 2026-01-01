import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookComponent } from './book.component';
import { BookService } from './services/book.service';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EditorModule } from '@tinymce/tinymce-angular';
import { ComponentsModule } from '../../common/components/components.module';

@NgModule({
  declarations: [BookComponent, SafeHtmlPipe],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: BookComponent }]),

    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule,

    EditorModule,
    ComponentsModule,
  ],
  exports: [BookComponent, SafeHtmlPipe],
  providers: [BookService],
})
export class BookModule {}
