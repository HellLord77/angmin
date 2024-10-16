import {Data} from './datum.model';

export interface PaginatedData {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: Data;
}
