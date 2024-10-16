import {inject, Injectable} from '@angular/core';
import {map, throwError} from 'rxjs';

import {UndefinedAlias} from '../errors/undefined-alias.error';
import {NetworkService} from './network.service';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  storageService = inject(StorageService);
  networkService = inject(NetworkService);

  getData$(alias: string, name: string) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    return this.networkService.getItemPaginated$(server, name).pipe(map((data) => data.data));
  }
}
