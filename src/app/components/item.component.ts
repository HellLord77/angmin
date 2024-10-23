import {DatePipe, DecimalPipe} from '@angular/common';
import {Component, inject, input, OnDestroy, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {pluralize} from 'inflection';
import {ConfirmationService, MenuItem, MessageService, PrimeIcons} from 'primeng/api';
import {BadgeModule} from 'primeng/badge';
import {ButtonModule} from 'primeng/button';
import {ChipsModule} from 'primeng/chips';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {MultiSelectModule} from 'primeng/multiselect';
import {PanelModule} from 'primeng/panel';
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {ToolbarModule} from 'primeng/toolbar';
import {concatMap, from, NEVER, Observable} from 'rxjs';

import {ConfirmDialogComponent} from '../../libs/confirm-dialog/confirm-dialog.component';
import {IconLabelComponent} from '../../libs/icon-label/icon-label.component';
import {IconTableHeaderComponent} from '../../libs/icon-table-header/icon-table-header.component';
import {ProgressDialogComponent} from '../../libs/progress-dialog/progress-dialog.component';
import {ActionType} from '../enums/action-type';
import {ExportType} from '../enums/export-type';
import {TaskType} from '../enums/task-type';
import {Datum} from '../models/datum.model';
import {PaginatedData} from '../models/paginated-data.model';
import {AngminService} from '../services/angmin.service';
import {DatumMapper} from '../types/datum-mapper';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [
    ButtonModule,
    DialogModule,
    RouterLink,
    BadgeModule,
    DatePipe,
    FileUploadModule,
    SplitButtonModule,
    TableModule,
    ToolbarModule,
    ToastModule,
    ContextMenuModule,
    MultiSelectModule,
    FormsModule,
    PanelModule,
    ChipsModule,
    IconLabelComponent,
    IconTableHeaderComponent,
    ConfirmDialogComponent,
    DecimalPipe,
    ProgressDialogComponent,
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.css',
  providers: [MessageService, ConfirmationService],
})
export class ItemComponent implements OnDestroy {
  server = input.required<string>();
  item = input.required<string>();

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  angminService = inject(AngminService);

  table = viewChild.required(Table);

  contextMenu: MenuItem[] = [
    {
      label: 'View',
      icon: PrimeIcons.EYE,
      command: () =>
        this.router.navigate([this.contextDatum.id], {relativeTo: this.activatedRoute}),
    },
    {separator: true},
    {
      label: 'Export',
      icon: PrimeIcons.UPLOAD,
      command: () => this.chooseExportData(ActionType.Context),
    },
    {
      label: 'Delete',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteData(ActionType.Context),
    },
  ];
  exportMenu: MenuItem[] = [
    {
      label: 'Export all',
      icon: PrimeIcons.UPLOAD,
      command: () => this.chooseExportData(ActionType.Global),
    },
  ];
  deleteMenu: MenuItem[] = [
    {
      label: 'Delete all',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteData(ActionType.Global),
    },
  ];

  chooseExportVisible = false;
  lastError?: Error;
  lastRefresh?: Date;

  taskType = TaskType.Read;
  task = NEVER.subscribe();
  taskMax = 0;
  taskCurrent = 0;
  taskDatum = '...';

  columns: string[] = [];
  selectedColumns?: string[];
  foreignColumns = new Map<string, string>();

  paginatedData: PaginatedData = {
    first: 0,
    prev: null,
    next: null,
    last: 0,
    pages: 0,
    items: 0,
    data: [],
  };
  selectedData: Datum[] = [];
  taskData: Datum[] = [];
  readonly clonedData = new Map<string, Datum>();
  contextDatum!: Datum;

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly ActionType = ActionType;
  protected readonly TaskType = TaskType;
  protected readonly ExportType = ExportType;

  ngOnDestroy() {
    this.task.unsubscribe();
  }

  refreshData() {
    this.lastError = undefined;

    const table = this.table();
    this.clonedData.forEach((datum) => table.cancelRowEdit(datum));
    this.clonedData.clear();

    this.taskType = TaskType.Read;
    this.task = this.angminService
      .readData$(
        this.server(),
        this.item(),
        table.first! / table.rows! + 1,
        table.rows!,
        table.multiSortMeta ?? [],
      )
      .subscribe({
        next: (paginatedData) => {
          this.paginatedData = paginatedData;
          const columns = new Set(paginatedData.data.flatMap((datum) => Object.keys(datum)));
          columns.delete('id');
          this.columns = [...columns];
          this.foreignColumns = new Map();
          columns.forEach((column) => {
            if (column.slice(-2) === 'Id') {
              this.foreignColumns.set(column, pluralize(column.slice(0, -2)));
            }
          });
          this.selectedColumns = undefined;
          const dataIds = new Set(paginatedData.data.map((datum) => datum.id));
          this.selectedData = this.selectedData.filter((datum) => dataIds.has(datum.id));
        },
        error: (error) => {
          this.lastError = error;
        },
        complete: () => this.completeRefreshData(),
      });
  }

  completeRefreshData() {
    this.lastRefresh = new Date();
    this.messageService.add({
      severity: 'info',
      summary: 'Collection loaded',
      detail: `Data #: ${this.paginatedData.items}`,
    });
  }

  cancelRefreshData() {
    this.task.unsubscribe();
    this.messageService.add({
      severity: 'error',
      summary: 'Refresh cancelled',
    });
  }

  handleImportData(fileUploadHandlerEvent: FileUploadHandlerEvent) {
    console.log(`Import data: ${fileUploadHandlerEvent}`);
  }

  chooseExportData(actionType: ActionType) {
    if (actionType === ActionType.Context) {
      this.taskData = [this.contextDatum];
    } else if (actionType === ActionType.Selection) {
      this.taskData = this.selectedData;
    } else {
      this.taskData = [];
    }

    this.chooseExportVisible = true;
  }

  chosenExportData(exportType: ExportType) {
    this.chooseExportVisible = false;
    console.log(`Export data: .${exportType} ${JSON.stringify(this.taskData)}`);
  }

  confirmDeleteData(actionType: ActionType) {
    if (actionType === ActionType.Context) {
      this.taskData = [this.contextDatum];
    } else if (actionType === ActionType.Selection) {
      this.taskData = this.selectedData;
    } else {
      this.taskData = [];
    }

    this.confirmationService.confirm({
      key: 'delete',
      icon: PrimeIcons.TRASH,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.acceptDeleteData(),
      reject: () => this.rejectDeleteData(),
    });
  }

  acceptDeleteData() {
    const datumMapper: DatumMapper = (server, item, datum) => {
      this.taskDatum = datum;
      return this.angminService.deleteValue$(server, item, datum);
    };

    let taskMap$: Observable<Datum>;
    if (this.taskData.length) {
      this.taskMax = this.taskData.length;
      taskMap$ = this.angminService.mapData$(
        this.server(),
        this.item(),
        this.taskData.map((datum) => datum.id),
        datumMapper,
      );
    } else {
      this.taskMax = this.paginatedData.items;
      taskMap$ = this.angminService.mapItemsData$(this.server(), [this.item()], datumMapper);
    }

    this.taskCurrent = 0;
    this.taskDatum = '...';
    this.taskType = TaskType.Delete;
    this.task = taskMap$.subscribe({
      next: () => ++this.taskCurrent,
      error: (error) => {
        this.lastError = error;
      },
      complete: () => this.completeDeleteData(),
    });
  }

  rejectDeleteData() {
    this.messageService.add({severity: 'info', summary: 'Delete cancelled'});
  }

  cancelDeleteData() {
    this.task.unsubscribe();
    this.messageService.add({
      severity: 'error',
      summary: 'Delete cancelled',
      detail: `Deleted data #: ${this.taskCurrent}/${this.taskMax}`,
    });
  }

  completeDeleteData() {
    this.refreshData();
    this.messageService.add({
      severity: this.taskCurrent === this.taskMax ? 'success' : 'warn',
      summary: 'Delete completed',
      detail: `Deleted data #: ${this.taskCurrent}`,
    });
  }

  initEditDatum(datum: Datum) {
    this.clonedData.set(datum.id, {...datum});
  }

  saveEditDatum(datum: Datum) {
    this.clonedData.delete(datum.id);

    // TODO: filter unmodified values

    this.taskData = [datum];
    this.taskDatum = datum.id;
    this.taskType = TaskType.Update;
    this.task = from(this.taskData)
      .pipe(
        concatMap((datum) => this.angminService.updateValue$(this.server(), this.item(), datum)),
      )
      .subscribe({
        error: (error) => {
          this.lastError = error;
        },
        complete: () => this.completeEditData(),
      });
  }

  cancelEditDatum(datum: Datum) {
    const index = this.paginatedData.data.findIndex((thisDatum) => thisDatum.id === datum.id);
    this.paginatedData.data[index] = this.clonedData.get(datum.id)!;
    this.clonedData.delete(datum.id);
    this.messageService.add({severity: 'info', summary: 'Edit cancelled'});
  }

  cancelEditData() {
    this.task.unsubscribe();
    this.messageService.add({
      severity: 'error',
      summary: 'Edit cancelled',
    });
  }

  completeEditData() {
    this.messageService.add({
      severity: 'success',
      summary: 'Edit completed',
    });
  }

  getRefreshSeverity() {
    if (this.lastRefresh) {
      const delta = new Date().valueOf() - this.lastRefresh.valueOf();
      if (delta <= 30 * 1000) {
        return 'success';
      } else if (delta <= 60 * 1000) {
        return 'warning';
      } else {
        return 'danger';
      }
    } else {
      return undefined;
    }
  }

  resetTable() {
    this.table().reset();
  }

  isEditColumnDisabled(value: unknown) {
    return typeof value !== 'string';
  }

  protected removeChipsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.remove();
  }
}
