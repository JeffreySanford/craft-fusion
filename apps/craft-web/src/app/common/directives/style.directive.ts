import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({ selector: '[appStyle]', standalone: true })
export class StyleDirective implements OnChanges {
  @Input('appStyle') styles: { [key: string]: string } | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(_: SimpleChanges) {
    // Remove previously set styles first
    const native = this.el.nativeElement as HTMLElement;
    const prev = native.getAttribute('data-applied-styles');
    if (prev) {
      try {
        const prevObj = JSON.parse(prev);
        Object.keys(prevObj).forEach(k => this.renderer.removeStyle(native, k));
      } catch {
        // ignore
      }
      native.removeAttribute('data-applied-styles');
    }

    if (this.styles) {
      Object.keys(this.styles).forEach(key => {
        this.renderer.setStyle(native, key, this.styles![key]);
      });
      native.setAttribute('data-applied-styles', JSON.stringify(this.styles));
    }
  }
}
