import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightDirective } from './common/directives/highlight.directive';
import { PopDirective } from './common/directives/pop.directive';
import { SparkleDirective } from './common/directives/sparkle.directive';
import { KatexModule } from './projects/data-visualizations/quantum-fisher-information/katex/katex.module';

@NgModule({
  declarations: [
    HighlightDirective,
    PopDirective,
    SparkleDirective
  ],
  imports: [
    CommonModule,
    KatexModule
  ],
  exports: [
    HighlightDirective,
    PopDirective,
    SparkleDirective,
    KatexModule
  ]
})
export class AnimatedDirectivesModule {}
