import {Pipe, PipeTransform} from '@angular/core';

import {Type} from '../enums/type';

@Pipe({
  name: 'type',
  standalone: true,
})
export class TypePipe implements PipeTransform {
  transform(value: unknown) {
    if (value === null) {
      return Type.Null;
    }
    if (Array.isArray(value)) {
      return Type.Array;
    }

    return typeof value as Type;
  }
}
