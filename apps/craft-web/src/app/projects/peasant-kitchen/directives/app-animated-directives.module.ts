import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedDirectivesModule } from '../../../common/directives/shared-directives.module';

@NgModule({
  imports: [
    CommonModule,
    SharedDirectivesModule
  ],
  exports: [
    SharedDirectivesModule
  ]
})
export class AppAnimatedDirectivesModule {}
