import { Injectable } from '@angular/core';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

@Injectable({
  providedIn: 'root'
})
export class DocParseService {
  constructor() { }

  async parseDoc(file: File): Promise<string> {
    const fileArrayBuffer = await file.arrayBuffer();
    const conversionResult = await mammoth.convertToHtml({ arrayBuffer: fileArrayBuffer });
    const turndown = new TurndownService();

    let markdown = turndown.turndown(conversionResult.value);

    // Detect numbered text and wrap it in a blockquote with a custom class
    markdown = markdown.replace(/(\d+[-]\d+)\s(.+?)(?=(\n\n)|(\n\d+[-]\d+)|$)/gs, (match, p1, p2) => {
      return `> **${p1}**\n> ${p2}\n{:.myth-section}`;
    });

    return markdown;
  }
}
