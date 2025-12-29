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
    bracketedRange: /^\[(?<start>\w+)-(?<end>\w+)\](?:\((?<link>[^\)]+)\))?(?<content>.*)$/,
    
    // Match markdown-style links with verse ranges
    bracketedRangeLink: /^\[(?<verse>\w+(?:-\w+)?)\](?:\((?<link>[^\)]+)\))(?<content>.*)$/,
    
    // Match standard verse ranges 123-456.
    verseRange: /^(?<start>\w+)-(?<end>\w+)\.\s*(?<content>.+)$/,
    
    // Match single verse with brackets and optional hyperlink
    bracketedVerse: /^\[(?<verse>\w+)\](?:\((?<link>[^\)]+)\))?(?<content>.*)$/,
    
    // Match standard verse format "123. Text"
    singleVerse: /^(?<verse>\w+)\.\s*(?<content>.+)$/,
    
    // Match ETCSL reference
    etcslRef: /^ETCSL\s+(?<ref>\d+\.\d+)\s*(?:\((?<link>[^\)]+)\))?\s*(?<content>.+)?$/,
    
    // Match continuation lines
    continuation: /^\s{2,}(?<content>.+)$/,
    // Updated mythSection pattern to handle A-Z ranges
    mythSection: /^(?<verse>\d{1,3}[A-Za-z]+)-(?<endVerse>\d{1,3}[A-Za-z]+)\s*(?<content>[\s\S]*)$/gm,
    // New mythKeywordSection pattern to detect myths based on keywords
    mythKeywordSection: /^(?<content>.*(?:Enki|Enlil|Anu|Ninhursag|netherworld|shrines|Land|heavens|earth).*)$/smi
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
                ${verse} ${content}
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

    let text = element.value || '';
    if (element.children) {
      element.children.forEach((child: any) => {
        text += this.extractText(child);
      });
    }
    return text.trim();
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
        value: `<div class="myth-section">
          ${verse} ${content}
        </div>`
      };
    }

    return element;
  }

  private detectMythSection(text: string) {
    // Remove extra whitespace and normalize quotes
    const normalizedText = text.trim().replace(/[""]/g, '"');

    this.log('detectMythSection - text:', normalizedText); // Log the normalized text

    for (const [patternName, pattern] of Object.entries(this.mythPatterns)) {
      if (patternName === 'mythSection' || patternName === 'mythKeywordSection') {
        const match = normalizedText.match(pattern);
        this.log(`Trying ${patternName} pattern: ${pattern}`);
        if (match && match.groups) {
          const book = match.groups['verse'];
          const verseRange = `${match.groups['start']}-${match.groups['end']}`;
          const ref = match.groups['ref'];
          const text = match.groups['content'];
          const url = match.groups['link'];
          
          return {
            verse: book || verseRange || ref || '',
            content: text?.trim() || '',
            link: url
          };
        } else {
          this.log(`${patternName} pattern did not match.`);
        }
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
    const verse = match.groups?.['verse'] || 
                 `${match.groups?.['start']}-${match.groups?.['end']}` ||
                 match.groups?.['ref'] || '';
    
    const content = match.groups?.['content']?.trim() || '';
    const link = match.groups?.['link'];

    if (verse) {
      // Move URL link to verse label only
      const labelPart = link
        ? `<span class="verse-label darkgreen-label">${verse}<a href="${link}" title="View source">†</a></span>`
        : `<span class="verse-label">${verse}</span>`;

      return {
        type: 'html',
        value: `<div class="myth-section">
          ${labelPart}
          <div class="myth-content">${content}</div>
        </div>`
      };
    }

    return null;
  }

  private processMythContent(text: string): string {
    const verses = text.split(/(?=\[\d+(?:-\d+)?\]|\d+(?:-\d+)?\.)/);
    
    return verses.map(verse => {
      // Match verse numbers and content
      const verseMatch = verse.match(/(?:\[(\d+(?:-\d+)?)\]|\b(\d+(?:-\d+)?)\.)(?:\((.*?)\))?\s*(.+)/s);
      
      if (verseMatch) {
        const verseNum = verseMatch[1] || verseMatch[2];
        const link = verseMatch[3];
        const content = verseMatch[4].trim();
        const labelPart = link
          ? `<span class="verse-label darkgreen-label">${verseNum}<a href="${link}" title="View source">†</a></span>`
          : `<span class="verse-label">${verseNum}</span>`;

        return `<div class="myth-section">
          ${labelPart}
          <div class="myth-content">${content}</div>
        </div>`;
      }
      return verse;
    }).join('\n');
  }
}