import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitTextPipe',
  standalone: true,
})
export class SplitTextPipe implements PipeTransform {
  transform(value: string): string[] {
    if (!value) return [];

    // Don't split markdown content, return as single block
    return [value];
  }
}
