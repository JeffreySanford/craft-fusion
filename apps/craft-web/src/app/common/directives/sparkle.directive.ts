import { Directive, ElementRef, OnInit, Renderer2, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appSparkle]',
  standalone: false,                              
})
export class SparkleDirective implements OnInit, OnDestroy {
  @Input('appSparkle') set appSparkle(value: any) {
    if (value) {
      this.startSparkling();
    } else {
      this.stopSparkling();
    }
  }

  private sparkles: HTMLElement[] = [];
  private intervalId: any = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'transform-origin', 'center');
    this.addKeyframes();
  }

  private startSparkling() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.createSparkle(), 2000);
  }

  private stopSparkling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy() {
    this.stopSparkling();
    this.sparkles.forEach(sparkle => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
    });
  }

  private addKeyframes() {
    if (document.getElementById('sparkle-styles')) return;
    const style = document.createElement('style');
    style.id = 'sparkle-styles';
    style.innerHTML = `
      @keyframes sparkle {
        0% { transform: translate(0, 0) scale(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  private createSparkle() {
    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();

    const sparkle = document.createElement('div');

    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;

    const tx = (Math.random() - 0.5) * 20;
    const ty = (Math.random() - 0.5) * 20;

    sparkle.style.position = 'absolute';
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.width = '4px';
    sparkle.style.height = '4px';
    sparkle.style.borderRadius = '50%';
    const css = (name: string, fallback: string) => {
      try {
        if (typeof window === 'undefined' || !window.getComputedStyle) return fallback;
        const v = getComputedStyle(document.documentElement).getPropertyValue(name);
        return v ? v.trim() : fallback;
    } catch {
        return fallback;
      }
    };
    const primary = css('--md-sys-primary', '#002868');
    const error = css('--md-sys-error', '#BF0A30');
    sparkle.style.backgroundColor = Math.random() > 0.5 ? error : primary;
    sparkle.style.boxShadow = '0 0 3px 1px rgba(255,255,255,0.8)';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.setProperty('--tx', `${tx}px`);
    sparkle.style.setProperty('--ty', `${ty}px`);
    sparkle.style.animation = 'sparkle 1.5s forwards';

    element.appendChild(sparkle);
    this.sparkles.push(sparkle);

    setTimeout(() => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
      this.sparkles = this.sparkles.filter(s => s !== sparkle);
    }, 1500);
  }
}
