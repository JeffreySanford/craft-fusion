import { Injectable } from '@angular/core';
import * as mammoth from 'mammoth';
import TurndownService from 'turndown';

@Injectable({
  providedIn: 'root'
})
export class DocParseService {
  private debugMode = true;

  // Enhanced myth patterns with named capturing groups
  private mythPatterns = {
    // Match bracketed verse ranges with optional hyperlinks
    bracketedRange: /^\[(?<start>\d+)-(?<end>\d+)\](?:\((?<link>[^\)]+)\))?(?<content>.*)$/,
    
    // Match markdown-style links with verse ranges
    bracketedRangeLink: /^\[(?<verse>\d+(?:-\d+)?)\](?:\((?<link>[^\)]+)\))(?<content>.*)$/,
    
    // Match standard verse ranges 123-456.
    verseRange: /^(?<start>\d+)-(?<end>\d+)\.\s*(?<content>.+)$/,
    
    // Match single verse with brackets and optional hyperlink
    bracketedVerse: /^\[(?<verse>\d+)\](?:\((?<link>[^\)]+)\))?(?<content>.*)$/,
    
    // Match standard verse format "123. Text"
    singleVerse: /^(?<verse>\d+)\.\s*(?<content>.+)$/,
    
    // Match ETCSL reference
    etcslRef: /^ETCSL\s+(?<ref>\d+\.\d+)\s*(?:\((?<link>[^\)]+)\))?\s*(?<content>.+)?$/,
    
    // Match continuation lines
    continuation: /^\s{2,}(?<content>.+)$/,
    mythSection: /^(?:\d+(?:-\d+)?\.\s+[\s\S]+?)(?=\n\n|\n(?:\d+(?:-\d+)?\.|$))/gm
  };

  private log(...args: any[]) {
    if (this.debugMode) {
      console.log('[DocParser]', ...args);
    }
  }

  constructor() { }

  async parseDoc(file: File): Promise<string> {
    console.log('\n=== Starting Document Parse ===');
    console.log(`Processing ${file.name} (${file.size} bytes)`);
    debugger; // Debug Point 1: Initial file check
    
    const fileArrayBuffer = await file.arrayBuffer();

    const options = {
      preProcessing: (input: ArrayBuffer) => {
        this.log('Starting pre-processing', input.byteLength, 'bytes');
        return input;
      },
      transformDocument: (element: any) => {
        // Only process paragraphs
        if (element.type !== 'paragraph') {
          return element;
        }

        // Extract text and log structure
        const text = this.extractText(element);
        this.log('Paragraph:', { text, type: element.type });

        // Check for myth section start
        const mythMatch = this.detectMythSection(text);
        if (mythMatch) {
          const {verse, content} = mythMatch;
          console.log('Found myth:', {verse, content});
          
          return {
            type: 'html',
            value: `
              <div class="myth-section">
                <p class="myth-line" data-verse="${verse}">
                  ${content}
                </p>
              </div>
            `
          };
        }

        return element;
      }
    };

    try {
      console.log('Converting to HTML...');
      const result = await mammoth.convertToHtml({ arrayBuffer: fileArrayBuffer }, options);
      debugger; // Debug Point 4: After HTML conversion
      console.log('HTML conversion complete. Length:', result.value.length);

      const turndownService = new TurndownService({
        keepReplacement: (content: string, node: Node) => {
          if (node instanceof HTMLElement) {
            if (node.classList?.contains('myth-line')) {
              console.log('Preserving myth:', node.outerHTML);
              return node.outerHTML;
            }
          }
          return content;
        }
      });

      const markdown = turndownService.turndown(result.value);
      debugger; // Debug Point 5: Final output
      console.log('=== Parse Complete ===');
      console.log('Output length:', markdown.length);
      return markdown;

    } catch (error) {
      console.error('Parse error:', error);
      throw error;
    }
  }

  private getParagraphText(element: any): string {
    if (!element.children) return '';

    return element.children
      .map((child: any) => {
        this.log('Child node:', child.type);
        if (child.type === 'text') return child.value;
        if (child.type === 'hyperlink') return this.getParagraphText(child);
        return '';
      })
      .join('')
      .trim();
  }

  private isMythLine(text: string): boolean {
    // Check basic patterns first
    const simplePattern = /^\d+\./;
    const rangePattern = /^\d+-\d+\./;
    
    return simplePattern.test(text) || rangePattern.test(text);
  }

  private parseMythLine(text: string): [string, string] {
    // Try matching verse range first
    const rangeMatch = text.match(this.mythPatterns.verseRange);
    if (rangeMatch) {
      const [_, start, end, content] = rangeMatch;
      return [`${start}-${end}`, content];
    }

    // Try matching single verse
    const singleMatch = text.match(this.mythPatterns.singleVerse); 
    if (singleMatch) {
      const [_, verse, content] = singleMatch;
      return [verse, content];
    }

    // Try matching ETCSL reference
    const etcslMatch = text.match(this.mythPatterns.etcslRef);
    if (etcslMatch) {
      const [_, ref, content] = etcslMatch;
      return [ref, content];
    }

    return ['', text];
  }

  private extractFullText(element: any): string {
    if (!element) return '';
    if (typeof element === 'string') return element;
    
    const text = element.value || '';
    const childTexts = element.children?.map((c: any) => this.extractFullText(c)) || [];
    
    return [text, ...childTexts].filter(t => t).join(' ').trim();
  }

  private extractText(element: any): string {
    if (!element) return '';
    if (typeof element === 'string') return element;
    
    const text = element.value || '';
    const childTexts = element.children?.map((c: any) => this.extractText(c)) || [];
    return [text, ...childTexts].filter(t => t).join(' ').trim();
  }

  private transformMythSection(element: any) {
    const text = this.extractText(element);
    
    // Try matching different myth patterns
    const rangeMatch = text.match(this.mythPatterns.verseRange);
    const singleMatch = text.match(this.mythPatterns.singleVerse);
    const etcslMatch = text.match(this.mythPatterns.etcslRef);

    if (rangeMatch || singleMatch || etcslMatch) {
      const [verse, content] = this.parseMythLine(text);
      this.log('Found myth:', {verse, content});
      
      return {
        type: 'html', 
        value: `
          <div class="myth-section">
            <p class="myth-line" data-verse="${verse}">
              ${content}
            </p>
          </div>
        `.trim()
      };
    }

    return element;
  }

  private detectMythSection(text: string) {
    // Remove extra whitespace and normalize quotes
    const normalizedText = text.trim().replace(/[""]/g, '"');

    for (const [patternName, pattern] of Object.entries(this.mythPatterns)) {
      const match = normalizedText.match(pattern);
      if (match?.groups) {
        console.log(`Matched myth pattern: ${patternName}`);
        return {
          verse: match.groups.verse || 
                `${match.groups.start}-${match.groups.end}` ||
                match.groups.ref || '',
          content: match.groups.content?.trim() || '',
          link: match.groups.link
        };
      }
    }
    return null;
  }

  private transformDocument(element: any) {
    if (element.type !== 'paragraph') {
      return element;
    }

    const text = this.extractText(element);
    console.log('\n=== Processing Paragraph ===');
    console.log('Raw text:', text);
    console.log('Length:', text.length);
    console.log('First 50 chars:', text.substring(0, 50));

    // Try each pattern in sequence
    for (const [patternName, pattern] of Object.entries(this.mythPatterns)) {
      const match = text.match(pattern);
      if (match) {
        console.log(`Matched ${patternName}:`, match.groups);
        return this.createMythElement(match);
      }
    }

    return element;
  }

  private createMythElement(match: RegExpMatchArray) {
    const verse = match.groups?.verse || 
                 `${match.groups?.start}-${match.groups?.end}` ||
                 match.groups?.ref || '';
    
    const content = match.groups?.content?.trim() || '';
    const link = match.groups?.link;

    if (verse) {
      const formattedLink = link ? 
        `<a href="${link}" title="View source" class="myth-link">${verse}</a>` : 
        verse;

      const formattedContent = content.replace(/^[\s.]+/, '').trim();

      console.log(`Processing myth [${verse}]:`, {
        content: formattedContent.substring(0, 50) + '...',
        hasLink: !!link
      });

      return {
        type: 'html',
        value: `<div class="myth-section">
          <p class="myth-line" data-verse="${verse}">
            ${formattedLink} ${formattedContent}
          </p>
        </div>`
      };
    }

    return null;
  }
}