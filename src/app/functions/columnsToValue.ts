import {Type} from '../enums/type';
import {Column} from '../models/column.model';

export function columnsToValue(columns: Column[]) {
  const obj: Record<string, unknown> = {};
  for (const column of columns) {
    if (column.columns) {
      const value = columnsToValue(column.columns);
      obj[column.name] = column.type === Type.Array ? Object.values(value) : value;
    } else {
      obj[column.name] = column.value;
    }
  }
  return obj;
}
