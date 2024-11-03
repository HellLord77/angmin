import '@codemirror/lang-json';

import {CodeEditor} from '@acrodata/code-editor';
import {AfterViewInit, Component, inject, input, OnDestroy, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {json, jsonParseLinter} from '@codemirror/lang-json';
import {linter, lintGutter} from '@codemirror/lint';
import {Extension} from '@codemirror/state';
import {basicSetup, minimalSetup} from 'codemirror';
import {jsonrepair} from 'jsonrepair';
import {ConfirmationService, PrimeIcons} from 'primeng/api';
import {Button} from 'primeng/button';
import {FileUploadModule} from 'primeng/fileupload';
import {InputTextModule} from 'primeng/inputtext';
import {PanelModule} from 'primeng/panel';
import {SelectButtonModule} from 'primeng/selectbutton';
import {TableModule} from 'primeng/table';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {ToolbarModule} from 'primeng/toolbar';
import {NEVER} from 'rxjs';

import {ConfirmDialogComponent} from '../components/confirm-dialog.component';
import {ErrorDialogComponent} from '../components/error-dialog.component';
import {IconLabelComponent} from '../components/icon-label.component';
import {IconTableHeaderComponent} from '../components/icon-table-header.component';
import {PageControlComponent} from '../components/page-control.component';
import {ProgressDialogComponent} from '../components/progress-dialog.component';
import {TreeTableComponent} from '../components/tree-table.component';
import {TaskType} from '../enums/task-type';
import {Type} from '../enums/type';
import {Column} from '../models/column.model';
import {Datum} from '../models/datum.model';
import {EditorSetup} from '../models/editor-setup.model';
import {StringPipe} from '../pipes/string.pipe';
import {TypePipe} from '../pipes/type.pipe';
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
    ToolbarModule,
    IconLabelComponent,
    PanelModule,
    PageControlComponent,
    ErrorDialogComponent,
    ProgressDialogComponent,
    TableModule,
    StringPipe,
    IconTableHeaderComponent,
    InputTextModule,
    TreeTableComponent,
    FileUploadModule,
    ConfirmDialogComponent,
  ],
  templateUrl: './datum.component.html',
  styleUrl: './datum.component.css',
  host: {class: 'h-full block'},
  providers: [ConfirmationService, TypePipe],
})
export class DatumComponent implements AfterViewInit, OnDestroy {
  server = input.required<string>();
  item = input.required<string>();
  datum = input.required<string>();

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  confirmationService = inject(ConfirmationService);
  typePipe = inject(TypePipe);
  visualService = inject(VisualService);
  notificationService = inject(NotificationService);
  angminService = inject(AngminService);

  treeTableComponent = viewChild.required(TreeTableComponent);
  codeEditor = viewChild.required(CodeEditor);

  editOptions = [
    {label: 'Simple', value: true, icon: PrimeIcons.PEN_TO_SQUARE},
    {label: 'Advanced', value: false, icon: PrimeIcons.FILE_EDIT},
  ];
  editorHidden = true;
  editorInvalid = false;
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

  value: Datum = {id: ''};
  columns: Column[] = [];
  json = '';

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly TaskType = TaskType;

  ngAfterViewInit() {
    this.refreshValue();
    this.visualService.setCodeEditor(this.codeEditor());
  }

  ngOnDestroy() {
    this.task.unsubscribe();
    this.visualService.unsetCodeEditor();
  }

  refreshValue() {
    this.lastError = undefined;

    this.treeTableComponent().collapseAll();

    this.taskType = TaskType.Read;
    this.task = this.angminService.readValue$(this.server(), this.item(), this.datum()).subscribe({
      next: (value) => {
        this.value = value;
        this.columns = this.getColumns();
        this.json = JSON.stringify(value, null, 2);
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
    this.notificationService.showCompleted(TaskType.Read, true, `Value #: ${this.json.length}`);
  }

  confirmDeleteValue() {
    this.confirmationService.confirm({
      key: 'delete',
      icon: PrimeIcons.TRASH,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.acceptDeleteValue(),
      reject: () => this.rejectDeleteValue(),
    });
  }

  acceptDeleteValue() {
    this.taskType = TaskType.Delete;
    this.task = this.angminService
      .deleteValue$(this.server(), this.item(), this.datum())
      .subscribe({
        error: (error) => {
          this.lastError = error;
        },
        complete: () => this.completeDeleteData(),
      });
  }

  rejectDeleteValue() {
    this.notificationService.showCancelled(TaskType.Delete, false);
  }

  cancelDeleteValue() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Delete, true);
  }

  completeDeleteData() {
    this.router.navigate(['../'], {relativeTo: this.activatedRoute}).then();
    this.notificationService.showCompleted(TaskType.Delete, true);
  }

  confirmSaveValue() {
    this.confirmationService.confirm({
      key: 'update',
      icon: PrimeIcons.SAVE,
      acceptLabel: 'Save',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.acceptSaveValue(),
      reject: () => this.rejectSaveValue(),
    });
  }

  acceptSaveValue() {
    const value = this.editorHidden
      ? (this.getTableValue() as unknown as Datum)
      : this.getEditorValue();
    this.json = JSON.stringify(value, null, 2);

    this.taskType = TaskType.Update;
    this.task = this.angminService.updateValue$(this.server(), this.item(), value).subscribe({
      error: (error) => {
        this.lastError = error;
      },
      complete: () => this.completeSaveValue(),
    });
  }

  rejectSaveValue() {
    this.notificationService.showCancelled(TaskType.Update, false);
  }

  cancelSaveValue() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Update, true);
  }

  completeSaveValue() {
    this.notificationService.showCompleted(TaskType.Update, true);
  }

  getTableValue(columns = this.columns) {
    const obj: Record<string, unknown> = {};
    for (const column of columns) {
      if (column.columns) {
        const value = this.getTableValue(column.columns);
        obj[column.name] = column.type === Type.Array ? Object.values(value) : value;
      } else {
        obj[column.name] = column.value;
      }
    }
    return obj;
  }

  getEditorValue() {
    const value: Datum = JSON.parse(this.json);
    value.id = this.datum();
    return value;
  }

  getColumns(obj: object = this.value) {
    const entries: [string, object][] = Array.isArray(obj)
      ? obj.map((value, index) => [index.toString(), value])
      : Object.entries(obj);

    return entries.map(([name, value]) => {
      const column: Column = {name, type: this.typePipe.transform(value), value};
      if (value !== null && typeof value === 'object') {
        column.columns = this.getColumns(value);
      }
      return column;
    });
  }

  tabChange() {
    if (this.editorHidden) {
      this.columns = this.getColumns(this.getEditorValue());
    } else {
      this.json = JSON.stringify(this.getTableValue(), null, 2);
    }
  }

  clearTable() {
    for (const column of this.columns) {
      if (column.name === 'id') {
        this.columns = [column];
        break;
      }
    }
  }

  validateEditor() {
    try {
      const value = JSON.parse(this.json);
      this.editorInvalid = this.typePipe.transform(value) !== Type.Object;
    } catch {
      this.editorInvalid = true;
    }
  }

  clearEditor() {
    this.json = '{}';
  }

  formatEditor() {
    let value: string;
    try {
      value = JSON.parse(this.json);
    } catch (error) {
      console.error(error);
      return;
    }
    this.json = JSON.stringify(value, null, 2);
  }

  repairEditor() {
    try {
      this.json = jsonrepair(this.json);
    } catch (error) {
      console.error(error);
    }
  }
}
