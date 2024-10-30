import {Type} from '../enums/type';

export interface Column {
  name: string;
  type: Type;
  value: unknown;
  columns?: Column[];
}
