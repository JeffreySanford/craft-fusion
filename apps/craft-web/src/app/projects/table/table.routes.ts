import { Routes } from '@angular/router';
import { RecordListComponent } from './record-list.component';
import { RecordDetailComponent } from './record-detail/record-detail.component';

export const tableRoutes: Routes = [
  { path: '', component: RecordListComponent },
  { path: ':id', component: RecordDetailComponent },
];
