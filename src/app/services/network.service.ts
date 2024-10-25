import {HttpClient, HttpParams} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';

import {Datum} from '../models/datum.model';
import {PaginatedData} from '../models/paginated-data.model';
import {Server} from '../models/server.model';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  httpClient = inject(HttpClient);

  #getUrl(server: Server, paths: string[] = []) {
    let pathname = '';
    if (server.path !== undefined) {
      paths.unshift(server.path);
    }
    paths.forEach((path) => {
      pathname += `/${path}`;
    });

    let credentials = '';
    if (server.username !== undefined || server.password !== undefined) {
      const username = server.username ?? '';
      const password = server.password ?? '';
      credentials = `${username}:${password}@`;
    }

    return `${server.scheme}://${credentials}${server.hostname}:${server.port}${pathname}`;
  }

  getServer$(server: Server) {
    return this.httpClient.get(this.#getUrl(server), {responseType: 'text'});
  }

  getItem$(server: Server, name: string, sort: string) {
    const params = new HttpParams().set('_sort', sort);
    return this.httpClient.get<Datum[]>(this.#getUrl(server, [name]), {params});
  }

  getItemPaginated$(server: Server, name: string, page: number, per_page: number, sort: string) {
    const params = new HttpParams()
      .set('_page', page.toString())
      .set('_per_page', per_page.toString())
      .set('_sort', sort);
    return this.httpClient.get<PaginatedData>(this.#getUrl(server, [name]), {params});
  }

  postItem$(server: Server, name: string, datum: Partial<Datum>) {
    return this.httpClient.post<Datum>(this.#getUrl(server, [name]), datum);
  }

  getValue$(server: Server, name: string, id: string) {
    return this.httpClient.get<Datum>(this.#getUrl(server, [name, id]));
  }

  putValue$(server: Server, name: string, id: string, value: Datum) {
    return this.httpClient.put<Datum>(this.#getUrl(server, [name, id]), value);
  }

  patchValue$(server: Server, name: string, id: string, value: Partial<Datum>) {
    return this.httpClient.patch<Datum>(this.#getUrl(server, [name, id]), value);
  }

  deleteValue$(server: Server, name: string, id: string) {
    return this.httpClient.delete<Datum>(this.#getUrl(server, [name, id]));
  }
}
