import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookComponent } from './book.component';
import { BookService } from './services/book.service';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

// Editor import if you're using a third-party editor like TinyMCE
import { EditorModule } from '@tinymce/tinymce-angular';

@NgModule({
  declarations: [
    BookComponent,
    SafeHtmlPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: BookComponent }
    ]),
    // Angular Material modules
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule,
    // Editor module
    EditorModule
  ],
  exports: [
    BookComponent,
    SafeHtmlPipe
  ],
  providers: [
    BookService
  ]
})
export class BookModule { }
