import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecordListComponent } from './record-list.component';
import { RecordDetailComponent } from './record-detail/record-detail.component';
import { RecordService } from './record.service';
import { EmploymentIncomePipe } from './pipes/employment-income.pipe';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';

@NgModule({
  declarations: [RecordListComponent, RecordDetailComponent, EmploymentIncomePipe], // Add EmploymentIncomePipe here
  imports: [CommonModule, FormsModule, MaterialModule],
  exports: [],
  providers: [RecordService],
})
export class TableModule {}
