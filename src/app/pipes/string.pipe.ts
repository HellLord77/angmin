import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'string',
  standalone: true,
})
export class StringPipe implements PipeTransform {
  transform(value: unknown) {
    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }
}
