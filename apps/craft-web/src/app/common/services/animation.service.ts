import { Injectable } from '@angular/core';
import { AnimationDataService } from './animation-data.service';
import { ElementRef } from '@angular/core';

/**
 * Service for managing animations across the application.
 * Provides methods for checking animation preferences and
 * dynamically applying animations.
 */
@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  // Check if the user prefers reduced motion
  private prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private animationDataService: AnimationDataService) {
    // Listen for changes to the prefers-reduced-motion media query
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
      this.prefersReducedMotion = e.matches;
    });
  }

  /**
   * Check if animations should be enabled based on user preferences
   */
  shouldAnimationsBeEnabled(): boolean {
    return !this.prefersReducedMotion;
  }

  /**
   * Get appropriate animation duration based on animation type and user preferences
   */
  getAnimationDuration(animationType: 'fast' | 'normal' | 'slow'): string {
    if (this.prefersReducedMotion) {
      return '0.001s'; // Nearly instantaneous for users who prefer reduced motion
    }
    
    switch (animationType) {
      case 'fast':
        return '0.2s';
      case 'slow':
        return '0.8s';
      default:
        return '0.4s';
    }
  }

  /**
   * Dynamically add animation class to elements
   */
  applyAnimation(element: HTMLElement, animationClass: string): void {
    if (!this.prefersReducedMotion) {
      element.classList.add(animationClass);
      // Remove the class after the animation completes
      element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
      }, { once: true });
    }
  }

  /**
   * Set up intersection observer for scroll animations
   */
  setupScrollAnimations(selector: string): void {
    if (this.prefersReducedMotion) return;
    
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, options);
    
    document.querySelectorAll(selector).forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Apply animation by name using AnimationDataService
   */
  applyAnimationByName(elementRef: ElementRef, animationName: string): void {
    // Get animation data from AnimationDataService
    const animationExample = this.animationDataService.searchAnimations(animationName)[0];
    if (!animationExample) return;
    
    // Apply animation using AnimationService functionality
    if (this.shouldAnimationsBeEnabled()) {
      // Apply animation using example data
    }
  }
}
