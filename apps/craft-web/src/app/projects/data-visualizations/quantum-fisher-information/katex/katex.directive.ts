import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';
// Fix the import to handle both ESM and CommonJS module formats
import katex from 'katex';

@Directive({
  selector: '[appKatex]',
  standalone: false
})
export class KatexDirective implements OnChanges {
  @Input('appKatex') equation: string = '';
  @Input() displayMode: boolean = true;
  @Input() throwOnError: boolean = false;
  @Input() errorColor: string = '#cc0000';
  @Input() macros: any = {
    "\\tr": "\\text{Tr}"
  };

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equation'] || changes['displayMode'] || 
        changes['throwOnError'] || changes['errorColor'] || changes['macros']) {
      this.renderEquation();
    }
  }

  private renderEquation(): void {
    if (this.equation) {
      try {
        const katexOptions = {
          displayMode: this.displayMode,
          throwOnError: this.throwOnError,
          errorColor: this.errorColor,
          macros: this.macros || {},
          trust: true
        };
        
        // Render equation
        const renderedEq = katex.renderToString(this.equation, katexOptions);
        this.renderer.setProperty(this.el.nativeElement, 'innerHTML', renderedEq);
        
        // Log successful renders in development mode
        if (console.debug) {
          console.debug('KaTeX directive rendered:', this.equation);
        }
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        const errorMessage = `<span style="color: ${this.errorColor}">Error rendering equation: ${this.equation}</span>`;
        this.renderer.setProperty(this.el.nativeElement, 'innerHTML', errorMessage);
      }
    } else {
      this.renderer.setProperty(this.el.nativeElement, 'innerHTML', '');
    }
  }
}
