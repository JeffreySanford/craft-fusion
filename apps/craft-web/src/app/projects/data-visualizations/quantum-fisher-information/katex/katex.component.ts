import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as katex from 'katex';

@Component({
  selector: 'app-katex',
  templateUrl: './katex.component.html',
  styleUrls: ['./katex.component.scss'],
  standalone: false
})
export class KatexComponent implements OnChanges {
  @Input() equation: string = '';
  @Input() displayMode: boolean = true;
  @Input() throwOnError: boolean = false;
  @Input() errorColor: string = '#cc0000';
  @Input() macros: any = {
    "\\tr": "\\text{Tr}"  // Default macros for common symbols
  };
  @Input() options: any = {}; // Allow passing all KaTeX options

  renderedEquation: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equation'] || changes['displayMode'] || changes['throwOnError'] 
        || changes['errorColor'] || changes['macros'] || changes['options']) {
      this.renderEquation();
    }
  }

  private renderEquation(): void {
    if (this.equation) {
      try {
        // Combine default options with any custom options passed
        const katexOptions = {
          displayMode: this.displayMode,
          throwOnError: this.throwOnError,
          errorColor: this.errorColor,
          macros: this.macros || {},
          trust: true,
          // Removed output: 'html' as it's not a valid KaTeX option
          ...this.options
        };
        
        this.renderedEquation = katex.renderToString(this.equation, katexOptions);
        console.log('Rendered equation:', this.equation, 'Result:', this.renderedEquation);
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        this.renderedEquation = `<span style="color: ${this.errorColor}">Error rendering equation: ${this.equation}</span>`;
      }
    } else {
      this.renderedEquation = '';
    }
  }
}
