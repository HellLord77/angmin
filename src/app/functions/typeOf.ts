import {Type} from '../enums/type';

export function typeOf(object: unknown) {
  if (object === null) {
    return Type.Null;
  }
  if (Array.isArray(object)) {
    return Type.Array;
  }

  return typeof object as Type;
}
