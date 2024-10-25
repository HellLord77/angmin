import '@codemirror/lang-json';

import {CodeEditor} from '@acrodata/code-editor';
import {AfterViewInit, Component, inject, input, OnDestroy, OnInit, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {json, jsonParseLinter} from '@codemirror/lang-json';
import {linter, lintGutter} from '@codemirror/lint';
import {Extension} from '@codemirror/state';
import {basicSetup, minimalSetup} from 'codemirror';
import {jsonrepair} from 'jsonrepair';
import {PrimeIcons} from 'primeng/api';
import {Button} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {PanelModule} from 'primeng/panel';
import {SelectButtonModule} from 'primeng/selectbutton';
import {TabViewModule} from 'primeng/tabview';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {ToolbarModule} from 'primeng/toolbar';
import {NEVER} from 'rxjs';

import {ErrorDialogComponent} from '../components/error-dialog.component';
import {PageControlComponent} from '../components/page-control.component';
import {ProgressDialogComponent} from '../components/progress-dialog.component';
import {TaskType} from '../enums/task-type';
import {IconLabelComponent} from '../icon-label.component';
import {EditorSetup} from '../models/editor-setup.model';
import {AngminService} from '../services/angmin.service';
import {NotificationService} from '../services/notification.service';
import {VisualService} from '../services/visual.service';

@Component({
  selector: 'app-datum',
  standalone: true,
  imports: [
    FormsModule,
    CodeEditor,
    Button,
    SelectButtonModule,
    ToggleButtonModule,
    TabViewModule,
    ToolbarModule,
    CardModule,
    IconLabelComponent,
    PanelModule,
    PageControlComponent,
    ErrorDialogComponent,
    ProgressDialogComponent,
  ],
  templateUrl: './datum.component.html',
  styleUrl: './datum.component.css',
})
export class DatumComponent implements OnInit, AfterViewInit, OnDestroy {
  server = input.required<string>();
  item = input.required<string>();
  datum = input.required<string>();

  visualService = inject(VisualService);
  notificationService = inject(NotificationService);
  angminService = inject(AngminService);

  codeEditor = viewChild.required(CodeEditor);

  setups: EditorSetup[] = [
    {'setup': 'Basic', 'extensions': [basicSetup, lintGutter(), json(), linter(jsonParseLinter())]},
    {'setup': 'Minimal', 'extensions': [minimalSetup, json()]},
    {'setup': 'None', 'extensions': []},
  ];
  extensions: Extension[] = this.setups[0].extensions;
  highlightWhitespace = false;

  lastError?: Error;
  lastRefresh?: Date;

  taskType = TaskType.Read;
  task = NEVER.subscribe();

  value = '';

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly TaskType = TaskType;

  ngOnInit() {
    this.refreshValue();
  }

  ngAfterViewInit() {
    this.visualService.setCodeEditor(this.codeEditor());
  }

  ngOnDestroy() {
    this.visualService.unsetCodeEditor();
  }

  refreshValue() {
    this.lastError = undefined;

    this.taskType = TaskType.Read;
    this.task = this.angminService.readValue$(this.server(), this.item(), this.datum()).subscribe({
      next: (value) => {
        this.value = value;
      },
      error: (error) => {
        this.lastError = error;
      },
      complete: () => this.completeRefreshItems(),
    });
  }

  cancelRefreshValue() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Read, true);
  }

  completeRefreshItems() {
    this.lastRefresh = new Date();
    this.notificationService.showCompleted(TaskType.Read, true, `Value #: ${this.value.length}`);
  }

  formatEditor() {
    let value: string;
    try {
      value = JSON.parse(this.value);
    } catch (error) {
      console.error(error);
      return;
    }
    this.value = JSON.stringify(value, null, 2);
  }

  repairEditor() {
    try {
      this.value = jsonrepair(this.value);
    } catch (error) {
      console.error(error);
    }
  }
}
