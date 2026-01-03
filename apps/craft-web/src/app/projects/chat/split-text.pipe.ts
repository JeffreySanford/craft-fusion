import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitTextPipe',
})
export class SplitTextPipe implements PipeTransform {
  transform(value: string): string[] {
    if (!value) return [];

    return [value];
  }
}
