import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceComponent } from './finance.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ComponentsModule } from '../../../common/components/components.module';
import { DirectivesModule } from '../../../common/directives/directives.module';


@NgModule({
  declarations: [FinanceComponent],
  imports: [CommonModule, FormsModule, MatSlideToggleModule, ComponentsModule, DirectivesModule],
  exports: [FinanceComponent],
})
export class FinanceModule {}
