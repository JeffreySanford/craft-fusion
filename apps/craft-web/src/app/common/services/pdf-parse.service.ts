import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import TurndownService from 'turndown';

@Injectable({
  providedIn: 'root'
})
export class PdfParseService {
  constructor() { }

  async parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = '';

    for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex++) {
      const page = await pdfDocument.getPage(pageIndex);
      const text = await page.getTextContent();
      textContent += text.items.map(item => (item as any).str).join(' ');
    }

    const turndown = new TurndownService();
    return turndown.turndown(textContent);
  }
}
