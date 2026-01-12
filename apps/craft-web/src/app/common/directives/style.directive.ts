import { Directive, ElementRef, Input, OnChanges, Renderer2, RendererStyleFlags2 } from '@angular/core';

@Directive({ selector: '[appStyle]', standalone: false })
export class StyleDirective implements OnChanges {
  @Input('appStyle') styles: { [key: string]: string } | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(): void {

    const native = this.el.nativeElement as HTMLElement;
    const prev = native.getAttribute('data-applied-styles');
    if (prev) {
      try {
        const prevObj = JSON.parse(prev);
        Object.keys(prevObj).forEach(k => {
          if (k.startsWith('--')) {
            native.style.removeProperty(k);
            return;
          }
          if (k.includes('-')) {
            this.renderer.removeStyle(native, k, RendererStyleFlags2.DashCase);
            return;
          }
          this.renderer.removeStyle(native, k);
        });
      } catch {

      }
      native.removeAttribute('data-applied-styles');
    }

    if (this.styles) {
      Object.entries(this.styles).forEach(([key, value]) => {
        if (value == null) {
          return;
        }
        if (key.startsWith('--')) {
          native.style.setProperty(key, value);
          return;
        }
        if (key.includes('-')) {
          this.renderer.setStyle(native, key, value, RendererStyleFlags2.DashCase);
          return;
        }
        this.renderer.setStyle(native, key, value);
      });
      native.setAttribute('data-applied-styles', JSON.stringify(this.styles));
    }
  }
}
