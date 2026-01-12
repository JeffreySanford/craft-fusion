import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({ selector: '[appTextColor]', standalone: false })
export class TextColorDirective implements OnChanges {
  @Input('appTextColor') color: string | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(): void {
    if (this.color) {
      this.renderer.setStyle(this.el.nativeElement, 'color', this.color);
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'color');
    }
  }
}
