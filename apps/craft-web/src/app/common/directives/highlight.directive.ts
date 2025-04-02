import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Directive that highlights an element when hovered over
 * Usage: <div appHighlight [highlightColor]="'rgba(255, 0, 0, 0.2)'"></div>
 */
@Directive({
  selector: '[appHighlight]',
  standalone: false
})
export class HighlightDirective implements OnInit {
  @Input() highlightColor: string = 'rgba(0, 0, 255, 0.1)';
  private originalBackgroundColor: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Store the original background color for restoration when not hovered
    this.originalBackgroundColor = this.el.nativeElement.style.backgroundColor || '';
  }

  @HostListener('mouseenter') onMouseEnter(): void {
    this.highlight(this.highlightColor);
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.highlight(this.originalBackgroundColor);
  }

  private highlight(color: string): void {
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', color);
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'background-color 0.3s ease');
  }
}
