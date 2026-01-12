import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({ selector: '[appBgColor]', standalone: false })
export class BgColorDirective implements OnChanges {
  @Input('appBgColor') color: string | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(): void {
    if (this.color) {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', this.color);
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'background-color');
    }
  }
}
