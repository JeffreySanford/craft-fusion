import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({ selector: '[appTextColor]', standalone: true })
export class TextColorDirective implements OnChanges {
  @Input('appTextColor') color: string | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(_: SimpleChanges) {
    if (this.color) {
      this.renderer.setStyle(this.el.nativeElement, 'color', this.color);
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'color');
    }
  }
}
