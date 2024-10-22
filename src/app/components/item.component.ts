import {DatePipe, DecimalPipe} from '@angular/common';
import {Component, inject, input, OnDestroy, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {pluralize} from 'inflection';
import {findIndex, flatten, keys, map} from 'lodash-es';
import {ConfirmationService, MenuItem, MessageService, PrimeIcons} from 'primeng/api';
import {BadgeModule} from 'primeng/badge';
import {ButtonModule} from 'primeng/button';
import {ChipsModule} from 'primeng/chips';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {DividerModule} from 'primeng/divider';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {MultiSelectModule} from 'primeng/multiselect';
import {PanelModule} from 'primeng/panel';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {ToolbarModule} from 'primeng/toolbar';
import {concatMap, from, NEVER, Observable, Subscription} from 'rxjs';

import {ConfirmDialogComponent} from '../../libs/confirm-dialog/confirm-dialog.component';
import {IconLabelComponent} from '../../libs/icon-label/icon-label.component';
import {IconTableHeaderComponent} from '../../libs/icon-table-header/icon-table-header.component';
import {ActionType} from '../enums/action-type';
import {ExportType} from '../enums/export-type';
import {State} from '../enums/state';
import {Datum} from '../models/datum.model';
import {PaginatedData} from '../models/paginated-data.model';
import {AngminService} from '../services/angmin.service';

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
    InputGroupAddonModule,
    InputGroupModule,
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
    ProgressSpinnerModule,
    IconTableHeaderComponent,
    ConfirmDialogComponent,
    DecimalPipe,
    DividerModule,
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

  state = State.Loading;
  chooseExportVisible = false;
  lastError!: Error;
  lastRefresh?: Date;
  refreshTask!: Subscription;

  task: Subscription = NEVER.subscribe();
  taskTotal = 0;
  taskComplete = 0;
  taskDatum?: Datum;
  protected taskValue = 0;

  columns: string[] = [];
  selectedColumns: string[] = [];
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
  readonly #clonedData = new Map<string, Datum>();
  contextDatum!: Datum;

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly State = State;
  protected readonly ActionType = ActionType;
  protected readonly ExportType = ExportType;

  constructor() {
    this.task.unsubscribe();
  }

  ngOnDestroy() {
    this.refreshTask?.unsubscribe();
    this.task.unsubscribe();
  }

  refreshData() {
    const table = this.table();

    this.state = State.Loading;
    for (const datum of this.#clonedData.values()) {
      table.cancelRowEdit(datum);
    }
    this.#clonedData.clear();

    this.refreshTask = this.angminService
      .getData$(
        this.server(),
        this.item(),
        table.first! / table.rows! + 1,
        table.rows!,
        table.multiSortMeta ?? [],
      )
      .subscribe({
        next: (paginatedData) => {
          this.paginatedData = paginatedData;
          const columns = new Set(flatten(paginatedData.data.map((datum) => keys(datum))));
          columns.delete('id');
          this.columns = [...columns];
          this.foreignColumns = new Map();
          columns.forEach((column) => {
            if (column.slice(-2) === 'Id') {
              this.foreignColumns.set(column, pluralize(column.slice(0, -2)));
            }
          });
          this.selectedColumns = [];
          const dataIds = new Set(map(paginatedData.data, 'id'));
          this.selectedData = this.selectedData.filter((datum) => dataIds.has(datum.id));
          this.lastRefresh = new Date();
          this.messageService.add({
            severity: 'info',
            summary: 'Collection loaded',
            detail: `Data #: ${paginatedData.items}`,
          });
          this.state = State.Loaded;
        },
        error: (error) => {
          this.lastError = error;
          this.state = State.Errored;
        },
      });
  }

  cancelRefresh() {
    this.refreshTask?.unsubscribe();
    this.state = State.Cancelled;
  }

  resetTable() {
    this.table().reset();
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
      icon: PrimeIcons.TRASH,
      accept: () => this.acceptDeleteData(),
      reject: () => this.rejectDeleteData(),
    });
  }

  acceptDeleteData() {
    let taskData$: Observable<Datum>;
    if (this.taskData.length) {
      this.taskTotal = this.taskData.length;
      taskData$ = from(this.taskData);
    } else {
      this.taskTotal = this.paginatedData.items;
      taskData$ = this.angminService.iterData$(this.server(), this.item());
    }

    this.taskComplete = 0;
    this.taskValue = 0;
    this.taskDatum = undefined;
    this.task = taskData$
      .pipe(
        concatMap((datum) => this.angminService.deleteValue$(this.server(), this.item(), datum.id)),
      )
      .subscribe({
        next: (datum) => {
          this.taskDatum = datum;
          this.taskValue = Math.ceil((++this.taskComplete / this.taskTotal) * 100);
        },
        complete: () => this.completeDeleteData(),
      });
  }

  rejectDeleteData() {
    this.messageService.add({severity: 'info', summary: 'Delete cancelled'});
  }

  completeDeleteData() {
    this.refreshData();
    this.messageService.add({
      severity: this.taskComplete === this.taskTotal ? 'success' : 'warn',
      summary: 'Delete completed',
      detail: `Deleted data #: ${this.taskComplete}`,
    });
  }

  cancelDeleteData() {
    this.task.unsubscribe();
    this.messageService.add({
      severity: 'error',
      summary: 'Delete cancelled',
      detail: `Deleted data #: ${this.taskComplete}/${this.taskTotal}`,
    });
  }

  initEditDatum(datum: Datum) {
    this.#clonedData.set(datum.id, {...datum});
  }

  saveEditDatum(datum: Datum) {
    console.log(`Save data: ${JSON.stringify(datum)}`);
  }

  cancelEditDatum(datum: Datum) {
    const index = findIndex(this.paginatedData.data, {id: datum.id});
    this.paginatedData.data[index] = this.#clonedData.get(datum.id)!;
    this.#clonedData.delete(datum.id);
    this.messageService.add({severity: 'info', summary: 'Edit cancelled'});
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

  isEditColumnDisabled(value: unknown) {
    return typeof value !== 'string';
  }

  protected removeChipsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.remove();
  }
}
