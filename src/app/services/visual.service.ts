import {CodeEditor} from '@acrodata/code-editor';
import {inject, Injectable} from '@angular/core';

import {Theme} from '../enums/theme';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class VisualService {
  storageService = inject(StorageService);

  #linkElement = document.getElementById('app-theme') as HTMLLinkElement;
  #codeEditor?: CodeEditor;

  constructor() {
    this.setScale(this.storageService.getScale());
    this.setTheme(this.storageService.getTheme());
  }

  setCodeEditor(codeEditor: CodeEditor) {
    this.#codeEditor = codeEditor;
    codeEditor.setTheme(this.storageService.getTheme());
  }

  unsetCodeEditor() {
    this.#codeEditor = undefined;
  }

  setScale(scale: number) {
    document.documentElement.style.fontSize = `${1 + 0.125 * scale}rem`;
    this.storageService.setScale(scale);
  }

  setTheme(theme: Theme) {
    this.#linkElement.href = `theme-${theme}.css`;
    this.#codeEditor?.setTheme(theme);
    this.storageService.setTheme(theme);
  }
}
