import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { TurndownWrapperService } from './turndown-wrapper.service';

@Injectable({
  providedIn: 'root'
})
export class PdfParseService {
  constructor(private readonly turndownWrapper: TurndownWrapperService) { }

  async parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = '';

    for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex++) {
      const page = await pdfDocument.getPage(pageIndex);
      const text = await page.getTextContent();
      const textObj: any = text;
      textContent += (textObj.items || []).map((item: any) => item.str).join(' ');
    }

    return this.turndownWrapper.turndownHtml(textContent);
  }
}
