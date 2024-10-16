import {Injectable} from '@angular/core';

import {Scheme} from '../enums/scheme';
import {Server, Servers} from '../models/server.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  readonly #servers = new Map<string, Server>().set('localHost', {
    alias: 'localHost',
    hostname: 'localhost',
    port: 3000,
    scheme: Scheme.HTTP,
  });

  getServer(alias: string): Server | undefined {
    return this.#servers.get(alias);
  }

  getServers(): Servers {
    return [...this.#servers.values()];
  }
}
