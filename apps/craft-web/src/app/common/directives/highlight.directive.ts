import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: false,                                                            
})
export class HighlightDirective {
  @Input() highlightColor = 'rgba(191, 10, 48, 0.1)';
  @Input() textColor = '#BF0A30';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.highlightColor, this.textColor);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight(null, null);
  }

  private highlight(backgroundColor: string | null, textColor: string | null) {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s ease-in-out');
    this.renderer.setStyle(this.el.nativeElement, 'background-color', backgroundColor);
    this.renderer.setStyle(this.el.nativeElement, 'color', textColor || 'inherit');
    this.renderer.setStyle(this.el.nativeElement, 'transform', backgroundColor ? 'scale(1.05)' : 'scale(1)');
  }
}
