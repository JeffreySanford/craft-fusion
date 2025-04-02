import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

/**
 * Directive that adds a "pop" effect when an element is clicked
 * Usage: <button appPop [popScale]="1.1"></button>
 */
@Directive({
  selector: '[appPop]',
  standalone: false
})
export class PopDirective {
  @Input() popScale: number = 1.05;
  @Input() popDuration: number = 200; // milliseconds

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('click') onClick(): void {
    this.pop();
  }

  private pop(): void {
    // Add transition
    this.renderer.setStyle(this.el.nativeElement, 'transition', `transform ${this.popDuration}ms ease-out`);
    
    // Scale up
    this.renderer.setStyle(this.el.nativeElement, 'transform', `scale(${this.popScale})`);
    
    // Scale back after duration
    setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1)');
    }, this.popDuration);
  }
}
