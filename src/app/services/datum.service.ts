import {inject, Injectable} from '@angular/core';
import {map, throwError} from 'rxjs';

import {UndefinedAlias} from '../errors/undefined-alias.error';
import {NetworkService} from './network.service';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class DatumService {
  storageService = inject(StorageService);
  networkService = inject(NetworkService);

  getString$(alias: string, name: string, id: string) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    return this.networkService
      .getDatum$(server, name, id)
      .pipe(map((datum) => JSON.stringify(datum)));
  }
}
