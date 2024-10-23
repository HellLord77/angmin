import {inject, Injectable} from '@angular/core';
import {SortMeta} from 'primeng/api';
import {catchError, concatMap, from, map, throwError} from 'rxjs';

import {UndefinedAlias} from '../errors/undefined-alias.error';
import {UnparsableHtml} from '../errors/unparsable-html.error';
import {UnreachableServer} from '../errors/unreachable-server.error';
import {Datum} from '../models/datum.model';
import {Item} from '../models/item.model';
import {DatumMapper} from '../types/datum-mapper';
import {NetworkService} from './network.service';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class AngminService {
  storageService = inject(StorageService);
  networkService = inject(NetworkService);

  getServers() {
    return this.storageService.getServers();
  }

  #getItems(html: string): Item[] {
    const items: Item[] = [];

    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');
    const liElements = document.getElementsByTagName('li');

    Array.from(liElements).forEach((liElement) => {
      const aElement = liElement.getElementsByTagName('a');
      if (aElement.length !== 1) {
        return;
      }
      const textA = aElement[0].textContent;
      if (textA === null) {
        return;
      }
      const execA = /^\/(\w+)$/.exec(textA);
      if (execA === null) {
        return;
      }
      const name = execA[1];

      const spanElement = liElement.getElementsByTagName('span');
      if (spanElement.length !== 1) {
        return;
      }
      const textSpan = spanElement[0].textContent;
      if (textSpan === null) {
        return;
      }
      const execSpan = /^ - (\d+) items? $/.exec(textSpan.replaceAll(/\s+/g, ' '));
      if (execSpan === null) {
        return;
      }
      const length = parseInt(execSpan[1]);

      const item: Item = {name, length};
      items.push(item);
    });

    return items;
  }

  readItems$(alias: string) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    return this.networkService.getServer$(server).pipe(
      catchError(() => {
        throw new UnreachableServer(server);
      }),
      map((html: string) => {
        try {
          return this.#getItems(html);
        } catch {
          throw new UnparsableHtml(html);
        }
      }),
    );
  }

  readData$(alias: string, name: string, page: number, per_page: number, sortMetas: SortMeta[]) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    const sort = sortMetas
      .map((sortMeta) => `${sortMeta.order === 1 ? '' : '-'}${sortMeta.field}`)
      .toString();

    return this.networkService.getItemsPaginated$(server, name, page, per_page, sort);
  }

  readValue$(alias: string, name: string, id: string) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    return this.networkService
      .getValue$(server, name, id)
      .pipe(map((datum) => JSON.stringify(datum)));
  }

  updateValue$(alias: string, name: string, datum: Datum) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    const partialDatum: Partial<Datum> = {...datum};
    delete partialDatum.id;

    return this.networkService.patchValue$(server, name, datum.id, partialDatum);
  }

  deleteValue$(alias: string, name: string, id: string) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    return this.networkService.deleteValue$(server, name, id);
  }

  mapData$(alias: string, name: string, ids: string[], datumMapper: DatumMapper) {
    return from(ids).pipe(concatMap((id) => datumMapper(alias, name, id)));
  }

  mapPageData$(
    alias: string,
    name: string,
    page: number,
    per_page: number,
    datumMapper: DatumMapper,
  ) {
    return this.readData$(alias, name, page, per_page, []).pipe(
      concatMap((paginatedData) =>
        this.mapData$(
          alias,
          name,
          paginatedData.data.map((datum) => datum.id),
          datumMapper,
        ),
      ),
    );
  }

  mapPagesData$(
    alias: string,
    name: string,
    pages: number[],
    per_page: number,
    datumMapper: DatumMapper,
  ) {
    return from(pages).pipe(
      concatMap((page) => this.mapPageData$(alias, name, page, per_page, datumMapper)),
    );
  }

  mapItemData$(alias: string, name: string, datumMapper: DatumMapper) {
    return this.readData$(alias, name, 1, 100, []).pipe(
      concatMap((paginatedData) =>
        this.mapPagesData$(
          alias,
          name,
          Array.from({length: paginatedData.pages}, (_, index) => index + 1),
          100,
          datumMapper,
        ),
      ),
    );
  }

  mapItemsData$(alias: string, names: string[], datumMapper: DatumMapper) {
    return from(names).pipe(concatMap((name) => this.mapItemData$(alias, name, datumMapper)));
  }

  mapServerData$(alias: string, datumMapper: DatumMapper) {
    return this.readItems$(alias).pipe(
      concatMap((items) =>
        this.mapItemsData$(
          alias,
          items.map((item) => item.name),
          datumMapper,
        ),
      ),
    );
  }
}
