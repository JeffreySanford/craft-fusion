import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import MarkdownIt from 'markdown-it';

@Pipe({
  name: 'markdown',
  standalone: false,
})
export class MarkdownPipe implements PipeTransform {
  private md: MarkdownIt;

  constructor(private sanitizer: DomSanitizer) {
    this.md = new MarkdownIt({
      html: true,
      breaks: true,                    
      typographer: false,
    });

    this.md.renderer.rules = {
      ...this.md.renderer.rules,
      list_item_open: () => '<li class="formatted-list-item">',
      bullet_list_open: () => '<ul class="formatted-list">',
      ordered_list_open: () => '<ol class="formatted-list">',
      paragraph_open: () => '<p class="formatted-paragraph">',
    };
  }

  transform(value: string): SafeHtml {
    if (!value) return '';

    const cleanText = value

      .replace(/^(\d+\.)\s*\n+/gm, '$1 ')                      
      .replace(/^\*\s*\n+/gm, '* ')                    
      .replace(/\n\s*\n/g, '\n\n')                            
      .replace(/(\n\s*[-*]\s*|\n\s*\d+\.\s*)/g, '$1')                                          
      .trim();

    const html = this.md.render(cleanText);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
