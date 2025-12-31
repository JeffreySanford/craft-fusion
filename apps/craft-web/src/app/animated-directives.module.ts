import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightDirective } from './common/directives/highlight.directive';
import { PopDirective } from './common/directives/pop.directive';
import { SparkleDirective } from './common/directives/sparkle.directive';

@NgModule({
  declarations: [HighlightDirective, PopDirective, SparkleDirective],
  imports: [CommonModule],
  exports: [HighlightDirective, PopDirective, SparkleDirective],
})
export class AnimatedDirectivesModule {}
