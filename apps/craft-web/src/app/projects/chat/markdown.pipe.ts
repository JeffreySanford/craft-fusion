import { Pipe, PipeTransform } from '@angular/core';
import * as marked from 'marked';

@Pipe({
  name: 'markdown',
  standalone: false
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string): string {
    const result = marked.parse(value);
    if (result instanceof Promise) {
      throw new Error('Async parsing is not supported');
    }
    return result;
  }
}
