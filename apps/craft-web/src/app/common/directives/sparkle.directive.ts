import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

/**
 * Directive that adds a sparkle effect when hovered
 * Usage: <div appSparkle [sparkleColor]="'gold'"></div>
 */
@Directive({
  selector: '[appSparkle]',
  standalone: false
})
export class SparkleDirective {
  @Input() sparkleColor: string = 'gold';
  @Input() sparkleCount: number = 5;
  private sparkles: HTMLElement[] = [];

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter(): void {
    this.createSparkles();
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.removeSparkles();
  }

  private createSparkles(): void {
    // Get element dimensions and position
    const rect = this.el.nativeElement.getBoundingClientRect();
    
    // Create sparkles
    for (let i = 0; i < this.sparkleCount; i++) {
      setTimeout(() => {
        // Create a sparkle element
        const sparkle = this.renderer.createElement('div');
        
        // Style the sparkle
        this.renderer.setStyle(sparkle, 'position', 'absolute');
        this.renderer.setStyle(sparkle, 'width', '10px');
        this.renderer.setStyle(sparkle, 'height', '10px');
        this.renderer.setStyle(sparkle, 'background-color', this.sparkleColor);
        this.renderer.setStyle(sparkle, 'borderRadius', '50%');
        this.renderer.setStyle(sparkle, 'pointerEvents', 'none');
        this.renderer.setStyle(sparkle, 'opacity', '0');
        this.renderer.setStyle(sparkle, 'zIndex', '1000');
        
        // Random position within element
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        this.renderer.setStyle(sparkle, 'left', `${x}px`);
        this.renderer.setStyle(sparkle, 'top', `${y}px`);
        
        // Append to element
        this.renderer.appendChild(this.el.nativeElement, sparkle);
        this.sparkles.push(sparkle);
        
        // Animate sparkle
        this.renderer.setStyle(sparkle, 'transition', 'all 0.5s ease-out');
        
        // Delay slightly to create staggered effect
        setTimeout(() => {
          this.renderer.setStyle(sparkle, 'opacity', '1');
          this.renderer.setStyle(sparkle, 'transform', 'translate(0, -20px) scale(1.5)');
        }, 10);
        
        // Remove sparkle after animation
        setTimeout(() => {
          if (sparkle.parentNode) {
            this.renderer.removeChild(sparkle.parentNode, sparkle);
          }
          this.sparkles = this.sparkles.filter(s => s !== sparkle);
        }, 500);
      }, i * 100); // Stagger creation
    }
  }

  private removeSparkles(): void {
    // Remove all existing sparkles
    this.sparkles.forEach(sparkle => {
      if (sparkle.parentNode) {
        this.renderer.removeChild(sparkle.parentNode, sparkle);
      }
    });
    this.sparkles = [];
  }
}
