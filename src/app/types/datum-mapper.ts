import {Observable} from 'rxjs';

import {Datum} from '../models/datum.model';

export type DatumMapper = (alias: string, item: string, id: string) => Observable<Datum>;
