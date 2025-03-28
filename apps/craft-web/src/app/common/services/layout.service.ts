import { Injectable, ElementRef, Renderer2 } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  constructor(private logger: LoggerService) {
    this.logger.registerService('LayoutService');
    this.logger.info('Layout service initialized', { 
      type: 'CORE_STYLING'
    });
    
    // Set core layout CSS variables
    this.setLayoutCSSVariables();
  }
  
  /**
   * Set core layout CSS variables to ensure consistent sizing
   */
  private setLayoutCSSVariables(): void {
    // Set footer height variables for consistency across components
    document.documentElement.style.setProperty('--md-sys-footer-height', '3em');
    document.documentElement.style.setProperty('--md-sys-footer-expanded-height', '12em');
    
    // Set sidebar width variables
    document.documentElement.style.setProperty('--md-sys-sidebar-width', '250px');
    document.documentElement.style.setProperty('--md-sys-sidebar-collapsed-width', '7em');
    
    // Add bottom margin for mainstage
    document.documentElement.style.setProperty('--mainstage-margin', this.getMainstageMargin());
    
    this.logger.debug('Set core layout CSS variables', {
      type: 'CORE_STYLING',
      footerHeight: '3em',
      footerExpandedHeight: '12em',
      sidebarWidth: '250px',
      sidebarCollapsedWidth: '7em',
      mainstageMargin: this.getMainstageMargin()
    });
  }

  /**
   * Calculates and sets the width of the longest button in a sidebar
   * @param container The container element that holds the sidebar buttons
   * @param buttonSelector CSS selector for the buttons to measure
   * @param renderer The renderer instance from the component context
   * @param extraPadding Optional extra padding to add (in px)
   */
  calculateSidebarButtonWidth(
    container: ElementRef, 
    buttonSelector: string, 
    renderer: Renderer2,
    extraPadding: number = 20
  ): void {
    this.logger.debug('Starting sidebar button width calculation', {
      type: 'CORE_STYLING', 
      selector: buttonSelector,
      extraPadding
    });
    
    if (!container || !container.nativeElement) {
      this.logger.warn('No valid container provided for sidebar button calculation', {
        type: 'CORE_STYLING'
      });
      return;
    }

    // Get all buttons in the container
    const buttons = container.nativeElement.querySelectorAll(buttonSelector);
    
    if (!buttons || buttons.length === 0) {
      this.logger.warn('No buttons found for width calculation', { 
        type: 'CORE_STYLING',
        selector: buttonSelector 
      });
      return;
    }

    // Create a temporary hidden element to measure text width
    const tempElement = renderer.createElement('span');
    renderer.setStyle(tempElement, 'position', 'absolute');
    renderer.setStyle(tempElement, 'visibility', 'hidden');
    renderer.setStyle(tempElement, 'white-space', 'nowrap');
    renderer.setStyle(tempElement, 'font-family', getComputedStyle(buttons[0]).fontFamily);
    renderer.setStyle(tempElement, 'font-size', getComputedStyle(buttons[0]).fontSize);
    renderer.setStyle(tempElement, 'font-weight', getComputedStyle(buttons[0]).fontWeight);
    renderer.appendChild(document.body, tempElement);

    // Find the maximum width
    let maxWidth = 0;
    
    buttons.forEach((button: HTMLElement) => {
      // Get button text - either from textContent or consider icon width
      const buttonText = button.textContent?.trim() || '';
      const hasIcon = button.querySelector('.mat-icon') !== null;
      
      // Set text content to temp element to measure width
      tempElement.textContent = buttonText;
      
      // Get width
      let width = tempElement.offsetWidth;
      
      // Account for icon if present
      if (hasIcon) {
        width += 40; // Approximate width of icon + spacing
      }
      
      maxWidth = Math.max(maxWidth, width);
    });
    
    // Add some padding to ensure text fits
    maxWidth += extraPadding;
    
    // Remove temporary element
    renderer.removeChild(document.body, tempElement);
    
    // Set CSS variable for button width
    document.documentElement.style.setProperty('--sidebar-button-width', `${maxWidth}px`);
    
    this.logger.info('Set sidebar button width CSS variable', { 
      type: 'CORE_STYLING',
      width: `${maxWidth}px`, 
      buttons: buttons.length 
    });
  }

  /**
   * Get the margin for the mainstage
   * @returns The margin value as a string
   */
  getMainstageMargin(): string {
    return '0.25rem';
  }
}
