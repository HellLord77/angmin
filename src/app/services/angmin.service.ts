import {inject, Injectable} from '@angular/core';
import {FilterMatchMode, FilterMetadata, SortMeta} from 'primeng/api';
import {catchError, concatMap, from, map, Observable, Subscriber, timer} from 'rxjs';

import {UndefinedAlias} from '../errors/undefined-alias.error';
import {Datum} from '../models/datum.model';
import {Item} from '../models/item.model';
import {Server} from '../models/server.model';
import {NetworkService} from './network.service';
import {StorageService} from './storage.service';

export type DatumMapper = (alias: string, item: string, id: string) => Observable<Datum>;

@Injectable({
  providedIn: 'root',
})
export class AngminService {
  storageService = inject(StorageService);
  networkService = inject(NetworkService);

  getServers() {
    return this.storageService.getServers();
  }

  getServer$(alias: string) {
    return new Observable((subscriber: Subscriber<Server>) => {
      const server = this.storageService.getServer(alias);
      if (server === undefined) {
        throw new UndefinedAlias(alias);
      }

      subscriber.next(server);
      subscriber.complete();
    });
  }

  #delayError<T>(observable: Observable<T>): Observable<T> {
    const end = 1000 + window.performance.now();

    return observable.pipe(
      catchError((error) =>
        timer(end - window.performance.now()).pipe(
          concatMap(() => {
            throw error;
          }),
        ),
      ),
    );
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
    return this.#delayError(
      this.getServer$(alias).pipe(
        concatMap((server) => this.networkService.getServer$(server)),
        map((html) => this.#getItems(html)),
      ),
    );
  }

  readData$(alias: string, name: string, sortMetas: SortMeta[]) {
    const sort = sortMetas
      .map((sortMeta) => `${sortMeta.order === 1 ? '' : '-'}${sortMeta.field}`)
      .toString();

    return this.#delayError(
      this.getServer$(alias).pipe(
        concatMap((server) => this.networkService.getItem$(server, name, sort)),
      ),
    );
  }

  readPaginatedData$(
    alias: string,
    name: string,
    page: number,
    per_page: number,
    sortMetas: SortMeta[],
    filters: Record<string, FilterMetadata[]>,
  ) {
    const sort = sortMetas
      .map((sortMeta) => `${sortMeta.order === 1 ? '' : '-'}${sortMeta.field}`)
      .toString();
    console.log(filters);
    const conditions: Record<string, string> = {};
    Object.entries(filters).forEach(([field, filterMetadata]) => {
      const value = filterMetadata[0].value;
      if (value) {
        const filterMatchMode = filterMetadata[0].matchMode!;
        if (filterMatchMode === FilterMatchMode.NOT_EQUALS) {
          field = `${field}_ne`;
        } else if (filterMatchMode === FilterMatchMode.LESS_THAN) {
          field = `${field}_lt`;
        } else if (filterMatchMode === FilterMatchMode.LESS_THAN_OR_EQUAL_TO) {
          field = `${field}_lte`;
        } else if (filterMatchMode === FilterMatchMode.GREATER_THAN) {
          field = `${field}_gt`;
        } else if (filterMatchMode === FilterMatchMode.GREATER_THAN_OR_EQUAL_TO) {
          field = `${field}_gte`;
        }
        conditions[field] = filterMetadata[0].value;
      }
    });
    console.log(conditions);

    return this.#delayError(
      this.getServer$(alias).pipe(
        concatMap((server) =>
          this.networkService.getItemPaginated$(server, name, page, per_page, sort, conditions),
        ),
      ),
    );
  }

  readValue$(alias: string, name: string, id: string) {
    return this.#delayError(
      this.getServer$(alias).pipe(
        concatMap((server) => this.networkService.getValue$(server, name, id)),
      ),
    );
  }

  updateValue$(alias: string, name: string, datum: Datum) {
    return this.#delayError(
      this.getServer$(alias).pipe(
        concatMap((server) => this.networkService.putValue$(server, name, datum.id, datum)),
      ),
    );
  }

  updatePartialValue$(alias: string, name: string, datum: Datum) {
    const partialDatum: Partial<Datum> = {...datum};
    delete partialDatum.id;

    return this.#delayError(
      this.getServer$(alias).pipe(
        concatMap((server) =>
          this.networkService.patchValue$(server, name, datum.id, partialDatum),
        ),
      ),
    );
  }

  deleteValue$(alias: string, name: string, id: string) {
    return this.#delayError(
      this.getServer$(alias).pipe(
        concatMap((server) => this.networkService.deleteValue$(server, name, id)),
      ),
    );
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
    return this.readPaginatedData$(alias, name, page, per_page, [], {}).pipe(
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
    return this.readPaginatedData$(alias, name, 1, 100, [], {}).pipe(
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
