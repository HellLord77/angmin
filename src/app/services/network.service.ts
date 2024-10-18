import {HttpClient, HttpParams} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';

import {Data, Datum} from '../models/datum.model';
import {PaginatedData} from '../models/paginated-data.model';
import {Server} from '../models/server.model';
import {ConfigService} from './config.service';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  httpClient = inject(HttpClient);
  configService = inject(ConfigService);

  #getUrl(server: Server, paths: string[] = []) {
    let pathname = '';
    if (server.path !== undefined) {
      paths.unshift(server.path);
    }
    for (const path of paths) {
      pathname += `/${path}`;
    }

    let credentials = '';
    if (server.username !== undefined || server.password !== undefined) {
      const username = server.username ?? '';
      const password = server.password ?? '';
      credentials = `${username}:${password}@`;
    }

    return `${server.scheme}://${credentials}${server.hostname}:${server.port}${pathname}`;
  }

  headServer$(server: Server) {
    return this.httpClient.head(this.#getUrl(server));
  }

  getServer$(server: Server) {
    return this.httpClient.get(this.#getUrl(server), {responseType: 'text'});
  }

  getItem$(server: Server, name: string) {
    return this.httpClient.get<Data>(this.#getUrl(server, [name]));
  }

  getItemPaginated$(
    server: Server,
    name: string,
    page = 1,
    per_page = this.configService.itemsPerPage,
  ) {
    const params = new HttpParams()
      .set('_page', page.toString())
      .set('_per_page', per_page.toString());
    return this.httpClient.get<PaginatedData>(this.#getUrl(server, [name]), {params});
  }

  getDatum$(server: Server, name: string, id: string) {
    return this.httpClient.get<Datum>(this.#getUrl(server, [name, id]));
  }
}
