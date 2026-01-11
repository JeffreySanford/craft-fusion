import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({ selector: '[appBgColor]', standalone: true })
export class BgColorDirective implements OnChanges {
  @Input('appBgColor') color: string | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(_: SimpleChanges) {
    if (this.color) {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', this.color);
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'background-color');
    }
  }
}
