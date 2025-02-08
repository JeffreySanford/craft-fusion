import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookComponent } from './book.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { RouterModule, Routes } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { FileUploadService } from '../../common/services/file-upload.service';
import { MatIconModule } from '@angular/material/icon';

const routes: Routes = [
  { path: '', component: BookComponent }
];

@NgModule({
  declarations: [BookComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EditorModule,
    RouterModule.forChild(routes),
    MatSidenavModule,
    MatListModule,
    MatIconModule
  ],
  providers: [
    {
      provide: TINYMCE_SCRIPT_SRC,
      useValue: 'tinymce/tinymce.min.js',
    },
    FileUploadService
  ],
})
export class BookModule {}
