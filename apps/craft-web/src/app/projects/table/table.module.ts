import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RecordListComponent } from './record-list.component';
import { RecordDetailComponent } from './record-detail/record-detail.component';
import { RouterModule } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner'; // May need to install
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [
    RecordListComponent,
    RecordDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
    NgxSpinnerModule,
    MatTooltipModule,
    RouterModule
  ],
  exports: [
    RecordListComponent,
    RecordDetailComponent
  ]
})
export class TableModule { }
