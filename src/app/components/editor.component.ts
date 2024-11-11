import {CodeEditor} from '@acrodata/code-editor';
import {AfterViewInit, Component, inject, input, OnDestroy, viewChild} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {json, jsonParseLinter} from '@codemirror/lang-json';
import {linter, lintGutter} from '@codemirror/lint';
import {Extension} from '@codemirror/state';
import {basicSetup, minimalSetup} from 'codemirror';
import {jsonrepair} from 'jsonrepair';
import {PrimeIcons, PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {ToolbarModule} from 'primeng/toolbar';

import {Type} from '../enums/type';
import {typeOf} from '../functions/typeOf';
import {Datum} from '../models/datum.model';
import {EditorSetup} from '../models/editor-setup.model';
import {VisualService} from '../services/visual.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    Button,
    CodeEditor,
    PrimeTemplate,
    SelectButtonModule,
    ToggleButtonModule,
    ToolbarModule,
    FormsModule,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
  host: {class: 'flex-column h-full'},
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  datum = input.required<Datum>();

  visualService = inject(VisualService);

  codeEditor = viewChild.required(CodeEditor);

  invalid = false;

  protected setups: EditorSetup[] = [
    {'setup': 'Basic', 'extensions': [basicSetup, lintGutter(), json(), linter(jsonParseLinter())]},
    {'setup': 'Minimal', 'extensions': [minimalSetup, json()]},
    {'setup': 'None', 'extensions': []},
  ];
  protected extensions: Extension[] = this.setups[0].extensions;
  protected highlightWhitespace = false;
  protected value = '';

  protected readonly PrimeIcons = PrimeIcons;

  constructor() {
    toObservable(this.datum).subscribe(() => {
      this.value = this.getJson();
    });
  }

  ngAfterViewInit() {
    this.visualService.setCodeEditor(this.codeEditor());
  }

  ngOnDestroy() {
    this.visualService.unsetCodeEditor();
  }

  getValue() {
    const value: Datum = JSON.parse(this.value);
    value.id = this.datum().id;
    return value;
  }

  protected getJson(obj: Datum = this.datum()) {
    return JSON.stringify(obj, null, 2);
  }

  protected validate() {
    try {
      const value = JSON.parse(this.value);
      this.invalid = typeOf(value) !== Type.Object;
    } catch {
      this.invalid = true;
    }
  }

  protected repair() {
    try {
      this.value = jsonrepair(this.value);
    } catch (error) {
      console.error(error);
    }
  }

  protected format() {
    const value = JSON.parse(this.value);
    this.value = this.getJson(value);
  }

  protected clear() {
    const value: Datum = {id: this.datum().id};
    this.value = this.getJson(value);
  }
}
