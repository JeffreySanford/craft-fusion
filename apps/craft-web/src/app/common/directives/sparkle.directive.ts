import { Directive, ElementRef, OnInit, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appSparkle]',
  standalone: false // Ensure standalone is false
})
export class SparkleDirective implements OnInit, OnDestroy {
  private sparkles: HTMLElement[] = [];
  private intervalId: unknown;
  
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  
  ngOnInit() {
    // Make the parent element position relative
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    
    // Add a subtle initial animation to draw attention
    this.renderer.setStyle(this.el.nativeElement, 'animation', 'pulse 2s infinite');
    this.renderer.setStyle(this.el.nativeElement, 'transform-origin', 'center');
    
    // Add keyframe animation definition
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.03); }
        100% { transform: scale(1); }
      }
      
      @keyframes sparkle {
        0% { transform: translate(0, 0) scale(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // Create occasional sparkles
    this.intervalId = setInterval(() => this.createSparkle(), 2000);
  }
  
  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Clean up sparkle elements
    this.sparkles.forEach(sparkle => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
    });
  }
  
  private createSparkle() {
    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();
    
    // Create a sparkle element
    const sparkle = document.createElement('div');
    
    // Random position within the element
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    
    // Random direction for animation
    const tx = (Math.random() - 0.5) * 20;
    const ty = (Math.random() - 0.5) * 20;
    
    // Style the sparkle
    sparkle.style.position = 'absolute';
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.width = '4px';
    sparkle.style.height = '4px';
    sparkle.style.borderRadius = '50%';
    sparkle.style.backgroundColor = Math.random() > 0.5 ? '#BF0A30' : '#002868';
    sparkle.style.boxShadow = '0 0 3px 1px rgba(255,255,255,0.8)';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.setProperty('--tx', `${tx}px`);
    sparkle.style.setProperty('--ty', `${ty}px`);
    sparkle.style.animation = 'sparkle 1.5s forwards';
    
    // Add to element
    element.appendChild(sparkle);
    this.sparkles.push(sparkle);
    
    // Remove sparkle after animation
    setTimeout(() => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
      this.sparkles = this.sparkles.filter(s => s !== sparkle);
    }, 1500);
  }
}
