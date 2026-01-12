import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StyleDirective } from './style.directive';
import { TextColorDirective } from './text-color.directive';
import { BgColorDirective } from './bg-color.directive';
import { SparkleDirective } from './sparkle.directive';
import { SpinnerDirective } from './spinner.directive';
import { PopDirective } from './pop.directive';
import { HighlightDirective } from './highlight.directive';

@NgModule({
  declarations: [
    StyleDirective,
    TextColorDirective,
    BgColorDirective,
    SparkleDirective,
    PopDirective,
    HighlightDirective,
  ],
  imports: [CommonModule, SpinnerDirective],
  exports: [
    StyleDirective,
    TextColorDirective,
    BgColorDirective,
    SparkleDirective,
    SpinnerDirective,
    PopDirective,
    HighlightDirective,
  ],
})
export class DirectivesModule {}
