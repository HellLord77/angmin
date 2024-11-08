import {Injectable} from '@angular/core';

import {Scale} from '../enums/scale';
import {Scheme} from '../enums/scheme';
import {Theme} from '../enums/theme';
import {isServer} from '../functions/isServer';
import {AngminData} from '../models/angmin-data.model';
import {Server} from '../models/server.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  #scale!: Scale;
  #theme!: Theme;
  #notify!: boolean;
  #servers!: Map<string, Server>;

  constructor() {
    this.init();

    const angminDataJSON = localStorage.getItem('angmin-data');
    if (angminDataJSON !== null) {
      let angminData: AngminData;
      try {
        angminData = JSON.parse(angminDataJSON);
      } catch {
        return;
      }

      if (Object.values(Scale).includes(angminData.scale)) {
        this.#scale = angminData.scale;
      }
      if (Object.values(Theme).includes(angminData.theme)) {
        this.#theme = angminData.theme;
      }
      this.#notify = Boolean(angminData.notify);
      if (Array.isArray(angminData.servers)) {
        for (const server of angminData.servers) {
          if (isServer(server)) {
            this.#servers.set(server.alias, server);
          }
        }
      }
    }
  }

  init() {
    this.#scale = Scale.Small;
    this.#theme = Theme.Dark;
    this.#notify = true;
    this.#servers = new Map<string, Server>();

    this.#servers.set('localHost', {
      alias: 'localHost',
      hostname: 'localhost',
      port: 3000,
      scheme: Scheme.HTTP,
    });
  }

  store() {
    const angminData: AngminData = {
      scale: this.#scale,
      theme: this.#theme,
      notify: this.#notify,
      servers: [...this.#servers.values()],
    };
    localStorage.setItem('angmin-data', JSON.stringify(angminData));
  }

  clear() {
    localStorage.removeItem('angmin-data');
  }

  getScale() {
    return this.#scale;
  }

  setScale(scale: Scale) {
    this.#scale = scale;
    this.store();
  }

  getTheme() {
    return this.#theme;
  }

  setTheme(theme: Theme) {
    this.#theme = theme;
    this.store();
  }

  getNotify() {
    return this.#notify;
  }

  setNotify(notify: boolean) {
    this.#notify = notify;
    this.store();
  }

  getServer(alias: string) {
    return this.#servers.get(alias);
  }

  getServers() {
    return [...this.#servers.values()];
  }

  setServer(server: Server) {
    this.#servers.set(server.alias, server);
    this.store();
  }
}
