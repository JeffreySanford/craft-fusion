import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecordListComponent } from './record-list.component';
import { RecordDetailComponent } from './record-detail/record-detail.component';
import { RecordService } from './record.service';
import { EmploymentIncomePipe } from './pipes/employment-income.pipe';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [RecordListComponent, RecordDetailComponent],
  imports: [CommonModule, FormsModule,  EmploymentIncomePipe],
  exports: [],
  providers: [RecordService, EmploymentIncomePipe],
})
export class TableModule {}
