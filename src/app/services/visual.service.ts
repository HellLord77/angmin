import {inject, Injectable} from '@angular/core';

import {Theme} from '../enums/theme';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class VisualService {
  storageService = inject(StorageService);

  #htmlElement = document.documentElement;
  #linkElement = document.getElementById('app-theme') as HTMLLinkElement;

  constructor() {
    this.setScale(this.storageService.getScale());
    this.setTheme(this.storageService.getTheme());
  }

  setScale(scale: number) {
    this.#htmlElement.style.fontSize = `${16 + 2 * scale}px`;
  }

  setTheme(theme: Theme) {
    this.#linkElement.href = `theme-${theme}.css`;
  }
}
