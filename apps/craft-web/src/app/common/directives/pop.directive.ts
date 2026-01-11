import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appPop]',
  standalone: false // Ensure standalone is false
})
export class PopDirective implements OnInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  
  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(0.95)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)');
    
    setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1)');
    }, 100);
  }
}
