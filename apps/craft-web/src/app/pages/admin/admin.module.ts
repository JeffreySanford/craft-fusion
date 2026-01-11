import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ServicesDashboardComponent } from './services-dashboard/services-dashboard.component';
import { LogsComponent } from './logs/logs.component';
import { AdminComponent } from './admin.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

// Import the ComponentsModule that contains the LoggerDisplayComponent
import { ComponentsModule } from '../../components/components.module';
// Import the AuthService that AdminComponent depends on
import { AuthService } from '../../common/services/auth/auth.service';


@NgModule({
  declarations: [
    ServicesDashboardComponent,
    LogsComponent,
    AdminComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatInputModule,
    MatNativeDateModule,
    MatTabsModule,
    MatButtonModule,
    MatListModule,
    ComponentsModule, // Import ComponentsModule to access LoggerDisplayComponent
    RouterModule.forChild([
      { path: '', component: AdminComponent }
    ])
  ],
  exports: [
    ServicesDashboardComponent
  ],
  providers: [
    { provide: 'AuthService', useExisting: AuthService }
  ]
})
export class AdminModule { }
