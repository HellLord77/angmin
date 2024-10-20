import {Injectable} from '@angular/core';

import {Scheme} from '../enums/scheme';
import {Theme} from '../enums/theme';
import {Server} from '../models/server.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  #scale = -1;
  #theme: Theme = Theme.Dark;
  #servers = new Map<string, Server>().set('localHost', {
    alias: 'localHost',
    hostname: 'localhost',
    port: 3000,
    scheme: Scheme.HTTP,
  });

  getScale() {
    return this.#scale;
  }

  setScale(scale: number) {
    this.#scale = scale;
  }

  getTheme() {
    return this.#theme;
  }

  setTheme(theme: Theme) {
    this.#theme = theme;
  }

  getServer(alias: string): Server | undefined {
    return this.#servers.get(alias);
  }

  getServers(): Server[] {
    return [...this.#servers.values()];
  }
}
