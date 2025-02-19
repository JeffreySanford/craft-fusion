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
    console.log('Converting DOCX to HTML...');
    
    // Convert DOCX to HTML with custom handler for myths
    const result = await mammoth.convertToHtml({ arrayBuffer: fileArrayBuffer }, {
      transformDocument: (element: any) => {
        if (element.type === 'paragraph') {
          const text = element.children?.[0]?.value || '';
          const mythMatch = text.match(/^(\d+(?:-\d+)?)\.\s+(.+)$/);
          
          if (mythMatch) {
            console.log('Found myth line:', mythMatch[1], mythMatch[2]);
            // Create a custom HTML structure for myths
            return {
              type: 'paragraph',
              children: [{
                type: 'html',
                value: `<div class="myth-line"><span class="myth-number">${mythMatch[1]}.</span>${mythMatch[2]}</div>`
              }]
            };
          }
        }
        return element;
      }
    });
    
    console.log('HTML conversion result:', result.value);
    return result.value;
  }
}
