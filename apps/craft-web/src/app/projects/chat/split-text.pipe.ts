import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitTextPipe'
})
export class SplitTextPipe implements PipeTransform {
  transform(value: string): string[] {
    return value.split('\n').filter(paragraph => paragraph.trim() !== '');
  }
}
