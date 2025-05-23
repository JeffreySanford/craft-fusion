import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

// Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// CDK Modules
import { CdkTableModule } from '@angular/cdk/table';
import { ScrollingModule } from '@angular/cdk/scrolling';

// Third-party Modules
import { NgxSpinnerModule } from 'ngx-spinner';

// Components
import { RecordListComponent } from './record-list.component';
import { RecordDetailComponent } from './record-detail/record-detail.component';
import { tableRoutes } from './table.routes';

@NgModule({
  declarations: [
    RecordListComponent,
    RecordDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(tableRoutes),

    // Material Modules
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,

    // CDK Modules
    CdkTableModule,
    ScrollingModule,

    // Third-party Modules
    NgxSpinnerModule,

    // Shared Modules
    // SharedDirectivesModule, // Commented out due to import error
    // SharedPipesModule // Commented out due to import error
  ],
  exports: [
    RecordListComponent // Export if needed elsewhere
  ],
  providers: [
    CurrencyPipe // Provides CurrencyPipe for use in the components
  ]
})
export class TableModule { }
