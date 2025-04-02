import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightDirective } from './highlight.directive';
import { PopDirective } from './pop.directive';
import { SparkleDirective } from './sparkle.directive';

@NgModule({
  declarations: [
    HighlightDirective,
    PopDirective,
    SparkleDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    HighlightDirective,
    PopDirective,
    SparkleDirective
  ]
})
export class SharedDirectivesModule {}
