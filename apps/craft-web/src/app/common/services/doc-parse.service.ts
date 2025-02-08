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
    return turndown.turndown(conversionResult.value);
  }
}
