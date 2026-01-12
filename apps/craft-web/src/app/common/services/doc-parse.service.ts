import { Injectable } from '@angular/core';
import * as mammoth from 'mammoth';
import { TurndownWrapperService } from './turndown-wrapper.service';

@Injectable({
  providedIn: 'root',
})
export class DocParseService {
  private debugMode = true;

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
}
