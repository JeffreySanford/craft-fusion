import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LoggerService } from '../services/logger.service';

/**
 * Pipe to safely render HTML content including SVG elements
 * Usage options:
 * [innerHTML]="svgString | sanitizeHtml"
 * [innerHTML]="svgString | sanitizeHtml:'#ff0000'" - with color override
 * [innerHTML]="svgString | sanitizeHtml:null:true" - with detailed logging
 * 
 * The pipe also logs usage to LoggerService for tracking and debugging purposes.
 */
@Pipe({
  name: 'sanitizeHtml',
  standalone: false, // Make sure this is false
  pure: false // Set to impure to ensure it runs on each change detection cycle
})
export class SanitizeHtmlPipe implements PipeTransform {
  // Store content hashes to avoid logging the same content repeatedly
  private processedHashes = new Set<number>();
  
  constructor(
    private sanitizer: DomSanitizer,
    private logger: LoggerService
  ) {}

  transform(html: string, colorOverride?: string | null, detailedLogging: boolean = false): SafeHtml {
    if (!html) return '';

    // Generate simple hash of content to avoid duplicate logs
    const contentHash = this.simpleHash(html);
    
    // Apply color override if provided
    let processedHtml = html;
    if (colorOverride) {
      processedHtml = this.applyColorOverride(html, colorOverride);
    }

    // Log the usage (only if this is the first time we've seen this content)
    if (!this.processedHashes.has(contentHash)) {
      this.logUsage(html, colorOverride, detailedLogging);
      this.processedHashes.add(contentHash);
      
      // Limit set size to prevent memory leaks
      if (this.processedHashes.size > 1000) {
        this.processedHashes.clear();
      }
    }

    return this.sanitizer.bypassSecurityTrustHtml(processedHtml);
  }

  /**
   * Log pipe usage to the LoggerService
   */
  private logUsage(html: string, colorOverride?: string | null, detailedLogging: boolean = false): void {
    const isSvg = html.includes('<svg');
    const contentType = isSvg ? 'SVG' : 'HTML';
    const contentLength = html.length;
    const colorInfo = colorOverride ? `with color override: ${colorOverride}` : '';
    
    const logDetails: any = {
      contentType,
      contentLength,
      timestamp: new Date(),
      component: this.detectCallingComponent()
    };
    
    if (colorOverride) {
      logDetails.colorOverride = colorOverride;
    }
    
    if (detailedLogging && contentLength < 500) {
      logDetails.content = html;
    }
    
    if (isSvg) {
      // Extract SVG attributes for diagnostics
      const svgWidth = this.extractAttribute(html, 'width');
      const svgHeight = this.extractAttribute(html, 'height');
      if (svgWidth) logDetails.svgWidth = svgWidth;
      if (svgHeight) logDetails.svgHeight = svgHeight;
      
      // Check for common issues in SVG content
      this.detectSvgIssues(html, logDetails);
    }

    this.logger.debug(`SanitizeHtml pipe used for ${contentType} content (${contentLength} chars) ${colorInfo}`, logDetails);
  }

  /**
   * Apply a color override to SVG content
   */
  private applyColorOverride(html: string, color: string): string {
    if (html.includes('<svg')) {
      // For SVG content - override path/stroke colors
      return html.replace(/stroke="([^"]+)"/g, `stroke="${color}"`)
                 .replace(/fill="([^"]+)"/g, (match, g1) => {
                   // Don't override fill="none" as it's usually important
                   return g1.toLowerCase() === 'none' ? match : `fill="${color}"`;
                 });
    }
    
    // For non-SVG content, wrap in a span with the color style
    return `<span style="color:${color}">${html}</span>`;
  }

  /**
   * Generate a simple hash for content to avoid duplicate logging
   */
  private simpleHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    
    return hash;
  }

  /**
   * Try to detect which component is using the pipe
   */
  private detectCallingComponent(): string {
    try {
      // This is a hacky way to try to get the component name
      // It relies on the call stack and is not guaranteed to work
      const stackLines = new Error().stack?.split('\n') || [];
      for (let i = 0; i < stackLines.length; i++) {
        const line = stackLines[i];
        if (line.includes('Component.')) {
          const match = line.match(/(\w+Component)\./);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * Extract an attribute value from SVG content
   */
  private extractAttribute(svg: string, attribute: string): string | null {
    const regex = new RegExp(`${attribute}="([^"]+)"`, 'i');
    const match = svg.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Check for common issues in SVG content
   */
  private detectSvgIssues(svg: string, logDetails: any): void {
    if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      logDetails.issue = 'SVG missing xmlns attribute';
    }
    
    if (svg.includes('preserveAspectRatio="none"')) {
      logDetails.warning = 'SVG uses preserveAspectRatio="none" which may cause distortion';
    }
  }
}
