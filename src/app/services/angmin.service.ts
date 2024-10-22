import {inject, Injectable} from '@angular/core';
import {forEach} from 'lodash';
import {Memoize} from 'lodash-decorators';
import {SortMeta} from 'primeng/api';
import {catchError, map, throwError} from 'rxjs';

import {UndefinedAlias} from '../errors/undefined-alias.error';
import {UnparsableHtml} from '../errors/unparsable-html.error';
import {UnreachableServer} from '../errors/unreachable-server.error';
import {Item} from '../models/item.model';
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

  getItems$(alias: string) {
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
          return this.getItems(html);
        } catch {
          throw new UnparsableHtml(html);
        }
      }),
    );
  }

  @Memoize
  private getItems(html: string): Item[] {
    const items: Item[] = [];

    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');
    const liElements = document.getElementsByTagName('li');

    forEach(liElements, (liElement) => {
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

  getData$(alias: string, name: string, page: number, per_page: number, sortMetas: SortMeta[]) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    const sort = sortMetas
      .map((sortMeta) => `${sortMeta.order === 1 ? '' : '-'}${sortMeta.field}`)
      .toString();

    return this.networkService.getDataPaginated$(server, name, page, per_page, sort);
  }

  getValue$(alias: string, name: string, id: string) {
    const server = this.storageService.getServer(alias);
    if (server === undefined) {
      return throwError(() => new UndefinedAlias(alias));
    }

    return this.networkService
      .getDatum$(server, name, id)
      .pipe(map((datum) => JSON.stringify(datum)));
  }
}
