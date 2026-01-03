import { Injectable } from '@angular/core';
import * as mammoth from 'mammoth';
import { TurndownWrapperService } from './turndown-wrapper.service';

@Injectable({
  providedIn: 'root',
})
export class DocParseService {
  private debugMode = true;

  private mythPatterns = {
    continuation: /^\s{2,}(?<content>.+)$/,

    mythSection: /^(?<verse>\d{1,3}[A-Za-z]+)-(?<endVerse>\d{1,3}[A-Za-z]+)\s*(?<content>[\s\S]*)$/gm,

    mythKeywordSection: /^(?<content>.*(?:Enki|Enlil|Anu|Ninhursag|netherworld|shrines|Land|heavens|earth).*)$/ims,
  };

  private log(...args: unknown[]) {
    if (this.debugMode) {
      console.log('[DocParser]', ...args);
    }
  }

  private isElement(obj: unknown): obj is Record<string, any> {
    return typeof obj === 'object' && obj !== null;
  }

  constructor(private readonly turndownWrapper: TurndownWrapperService) {}

  async parseDoc(file: File): Promise<string> {
    console.log('\n=== Starting Document Parse ===');
    console.log(`Processing ${file.name} (${file.size} bytes)`);

    const fileArrayBuffer = await file.arrayBuffer();

    const options = {
      preProcessing: (input: ArrayBuffer) => {
        this.log('Starting pre-processing', input.byteLength, 'bytes');
        return input;
      },
      transformDocument: (element: unknown) => {

        if (!this.isElement(element) || element['type'] !== 'paragraph') {
          return element;
        }

        const text = this.extractText(element);
        this.log('Paragraph:', { text, type: element['type'] });

        const mythMatch = this.detectMythSection(text);
        if (mythMatch) {
          const { verse, content } = mythMatch;
          console.log('Found myth:', { verse, content });

          return {
            type: 'html',
            value: `
              <div class="myth-section">
                ${verse} ${content}
              </div>
            `,
          };
        }

        return element;
      },
    };

    try {
      console.log('Converting to HTML...');
      const result = await mammoth.convertToHtml({ arrayBuffer: fileArrayBuffer }, options);
      console.log('HTML conversion complete. Length:', result.value.length);

      const markdown = this.turndownWrapper.turndownWithOptions(result.value, {
        keepReplacement: (content: string, node: Node) => {
          if (node instanceof HTMLElement) {
            if (node.classList?.contains('myth-line')) {
              console.log('Preserving myth:', node.outerHTML);
              return node.outerHTML;
            }
          }
          return content;
        },
      });
      console.log('=== Parse Complete ===');
      console.log('Output length:', markdown.length);
      return markdown;
    } catch (error) {
      console.error('Parse error:', error);
      throw error;
    }
  }

  private getParagraphText(element: unknown): string {
    if (!this.isElement(element) || !Array.isArray(element['children'])) return '';

    return element['children']
      .map((child: unknown) => {
        if (!this.isElement(child)) return '';
        this.log('Child node:', child['type']);
        if (child['type'] === 'text') return child['value'] || '';
        if (child['type'] === 'hyperlink') return this.getParagraphText(child);
        return '';
      })
      .join('')
      .trim();
  }

  private isMythLine(text: string): boolean {

    const simplePattern = /^\d+\./;
    const rangePattern = /^\d+-\d+\./;

    return simplePattern.test(text) || rangePattern.test(text);
  }

  private getMatchContent(match: RegExpMatchArray): string {
    const groupContent = match.groups?.['content'];
    if (typeof groupContent === 'string') {
      return groupContent;
    }
    const input = match.input ?? '';
    return input.slice(match[0].length);
  }

  private parseMythSegment(text: string): { verse: string; link?: string; content: string } | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const etcslMatch = this.parseEtcslSegment(trimmed);
    if (etcslMatch) return etcslMatch;

    const bracketed = this.parseBracketedSegment(trimmed);
    if (bracketed) return bracketed;

    const dotted = this.parseDottedSegment(trimmed);
    if (dotted) return dotted;

    return null;
  }

  private parseEtcslSegment(text: string): { verse: string; link?: string; content: string } | null {
    const prefix = 'ETCSL ';
    if (!text.startsWith(prefix)) return null;

    let rest = text.slice(prefix.length);
    let idx = this.consumeDigits(rest, 0);
    if (idx === 0 || rest.charAt(idx) !== '.') return null;
    idx += 1;
    const endDigits = this.consumeDigits(rest, idx);
    if (endDigits === idx) return null;

    const ref = rest.slice(0, endDigits);
    rest = rest.slice(endDigits).trimStart();

    let link: string | undefined;
    if (rest.startsWith('(')) {
      const closing = rest.indexOf(')');
      if (closing > 1) {
        link = rest.slice(1, closing).trim();
        rest = rest.slice(closing + 1);
      }
    }

    const result: { verse: string; link?: string; content: string } = { verse: ref, content: rest.trim() };
    if (link) result.link = link;
    return result;
  }

  private parseBracketedSegment(text: string): { verse: string; link?: string; content: string } | null {
    if (!text.startsWith('[')) return null;

    const closing = text.indexOf(']');
    if (closing <= 1) return null;

    const verse = text.slice(1, closing).trim();
    if (!this.isWordRange(verse)) return null;

    let rest = text.slice(closing + 1).trimStart();
    let link: string | undefined;
    if (rest.startsWith('(')) {
      const closingParen = rest.indexOf(')');
      if (closingParen > 1) {
        link = rest.slice(1, closingParen).trim();
        rest = rest.slice(closingParen + 1);
      }
    }

    const result: { verse: string; link?: string; content: string } = { verse, content: rest.trim() };
    if (link) result.link = link;
    return result;
  }

  private parseDottedSegment(text: string): { verse: string; link?: string; content: string } | null {
    const dotIndex = text.indexOf('.');
    if (dotIndex <= 0) return null;

    const verse = text.slice(0, dotIndex).trim();
    if (!this.isWordRange(verse)) return null;

    const content = text.slice(dotIndex + 1).trim();
    return { verse, content };
  }

  private isWordRange(value: string): boolean {
    if (!value) return false;
    const parts = value.split('-');
    if (parts.length === 1) return this.isWordToken(parts[0]);
    if (parts.length === 2) return this.isWordToken(parts[0]) && this.isWordToken(parts[1]);
    return false;
  }

  private isWordToken(value?: string): boolean {
    if (!value) return false;
    for (let i = 0; i < value.length; i++) {
      if (!this.isWordChar(value.charAt(i))) return false;
    }
    return true;
  }

  private isWordChar(char?: string): boolean {
    if (!char) return false;
    const code = char.charCodeAt(0);
    return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95;
  }

  private consumeDigits(text: string, start: number): number {
    let idx = start;
    while (idx < text.length && this.isDigitChar(text.charAt(idx))) {
      idx++;
    }
    return idx;
  }

  private parseMythLine(text: string): [string, string] {
    const parsed = this.parseMythSegment(text);
    if (parsed) {
      return [parsed.verse, parsed.content];
    }

    return ['', text];
  }

  private extractFullText(element: unknown): string {
    if (!element) return '';
    if (typeof element === 'string') return element;
    if (!this.isElement(element)) return '';

    const text = element['value'] || '';
    const childTexts = Array.isArray(element['children']) ? element['children'].map((c: unknown) => this.extractFullText(c)) : [];

    return [text, ...childTexts]
      .filter(t => t)
      .join(' ')
      .trim();
  }

  private extractText(element: unknown): string {
    if (!element) return '';
    if (typeof element === 'string') return element;
    if (!this.isElement(element)) return '';

    let text = element['value'] || '';
    if (Array.isArray(element['children'])) {
      element['children'].forEach((child: unknown) => {
        text += this.extractText(child);
      });
    }
    return text.trim();
  }

  private transformMythSection(element: unknown) {
    const text = this.extractText(element);

    const parsed = this.parseMythSegment(text);

    if (parsed) {
      const { verse, content } = parsed;
      this.log('Found myth:', { verse, content });

      return {
        type: 'html',
        value: `<div class="myth-section">
          ${verse} ${content}
        </div>`,
      };
    }

    return element;
  }

  private detectMythSection(text: string) {

    const normalizedText = text.trim().replace(/[""]/g, '"');

    this.log('detectMythSection - text:', normalizedText);                           

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
            link: url,
          };
        } else {
          this.log(`${patternName} pattern did not match.`);
        }
      }
    }
    return null;
  }

  private transformDocument(element: unknown) {
    if (!this.isElement(element) || element['type'] !== 'paragraph') {
      return element;
    }

    const text = this.extractText(element);
    console.log('\n=== Processing Paragraph ===');
    console.log('Raw text:', text);
    console.log('Length:', text.length);
    console.log('First 50 chars:', text.substring(0, 50));

    const parsed = this.parseMythSegment(text);
    if (parsed) {
      return this.buildMythElement(parsed.verse, parsed.content, parsed.link);
    }

    for (const [patternName, pattern] of Object.entries(this.mythPatterns)) {
      const match = text.match(pattern);
      if (match) {
        console.log(`Matched ${patternName}:`, match.groups);
        return this.createMythElement(match);
      }
    }

    return element;
  }

  private buildMythElement(verse: string, content: string, link?: string) {
    if (!verse) return null;

    const labelPart = link
      ? `<span class="verse-label darkgreen-label">${verse}<a href="${link}" title="View source">+</a></span>`
      : `<span class="verse-label">${verse}</span>`;

    return {
      type: 'html',
      value: `<div class="myth-section">
        ${labelPart}
        <div class="myth-content">${content}</div>
      </div>`,
    };
  }

  private createMythElement(match: RegExpMatchArray) {
    const verse = match.groups?.['verse'] || `${match.groups?.['start']}-${match.groups?.['end']}` || match.groups?.['ref'] || '';

    const content = (match.groups?.['content'] ?? this.getMatchContent(match)).trim();
    const link = match.groups?.['link'];

    return this.buildMythElement(verse, content, link);
  }

  private splitMythSegments(text: string): string[] {
    if (!text) return [];

    const segments: string[] = [];
    let start = 0;

    for (let i = 0; i < text.length; i++) {
      if (this.isVerseMarkerAt(text, i)) {
        if (i > start) {
          const segment = text.slice(start, i).trim();
          if (segment) segments.push(segment);
        }
        start = i;
      }
    }

    const tail = text.slice(start).trim();
    if (tail) segments.push(tail);

    return segments;
  }

  private isVerseMarkerAt(text: string, index: number): boolean {
    const char = text.charAt(index);

    if (char === '[') {
      const closeIndex = text.indexOf(']', index + 1);
      if (closeIndex === -1) return false;
      const verse = text.slice(index + 1, closeIndex);
      return this.isNumericRange(verse);
    }

    if (!this.isDigitChar(char)) return false;

    let pos = index;
    while (pos < text.length && this.isDigitChar(text.charAt(pos))) pos++;

    if (text.charAt(pos) === '-') {
      const rangeStart = ++pos;
      while (pos < text.length && this.isDigitChar(text.charAt(pos))) pos++;
      if (pos === rangeStart) return false;
    }

    return text.charAt(pos) === '.';
  }

  private isNumericRange(value: string): boolean {
    if (!value) return false;
    const parts = value.split('-');
    if (parts.length > 2) return false;
    return parts.every(part => this.isNumeric(part));
  }

  private isNumeric(value: string): boolean {
    if (!value) return false;
    for (let i = 0; i < value.length; i++) {
      if (!this.isDigitChar(value.charAt(i))) return false;
    }
    return true;
  }

  private isDigitChar(char?: string): boolean {
    if (!char) return false;
    const code = char.charCodeAt(0);
    return code >= 48 && code <= 57;
  }

  private processMythContent(text: string): string {
    const verses = this.splitMythSegments(text);

    return verses
      .map(verse => {
        const parsed = this.parseMythSegment(verse);

        if (parsed) {
          const { verse: verseNum, link, content } = parsed;
          const labelPart = link
            ? `<span class="verse-label darkgreen-label">${verseNum}<a href="${link}" title="View source">+</a></span>`
            : `<span class="verse-label">${verseNum}</span>`;

          return `<div class="myth-section">
          ${labelPart}
          <div class="myth-content">${content}</div>
        </div>`;
        }
        return verse;
      })
      .join('\n');
  }
}
