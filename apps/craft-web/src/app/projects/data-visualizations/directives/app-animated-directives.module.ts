import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedDirectivesModule } from '../../../common/directives/shared-directives.module';
import { KatexModule } from '../quantum-fisher-information/katex/katex.module';

@NgModule({
  imports: [
    CommonModule,
    SharedDirectivesModule,
    KatexModule
  ],
  exports: [
    SharedDirectivesModule,
    KatexModule
  ]
})
export class AppAnimatedDirectivesModule {}
