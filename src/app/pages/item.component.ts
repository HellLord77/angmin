import {DatePipe, DecimalPipe, JsonPipe} from '@angular/common';
import {Component, inject, input, OnDestroy, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {pluralize} from 'inflection';
import {ConfirmationService, MenuItem, PrimeIcons} from 'primeng/api';
import {BadgeModule} from 'primeng/badge';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {ChipsModule} from 'primeng/chips';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputSwitchModule} from 'primeng/inputswitch';
import {MultiSelectModule} from 'primeng/multiselect';
import {PanelModule} from 'primeng/panel';
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {ToolbarModule} from 'primeng/toolbar';
import {concatMap, from, NEVER, Observable} from 'rxjs';

import {ConfirmDialogComponent} from '../components/confirm-dialog.component';
import {ErrorDialogComponent} from '../components/error-dialog.component';
import {IconLabelComponent} from '../components/icon-label.component';
import {IconTableHeaderComponent} from '../components/icon-table-header.component';
import {PageControlComponent} from '../components/page-control.component';
import {ProgressDialogComponent} from '../components/progress-dialog.component';
import {ActionType} from '../enums/action-type';
import {ExportType} from '../enums/export-type';
import {TaskType} from '../enums/task-type';
import {Type} from '../enums/type';
import {Datum} from '../models/datum.model';
import {PaginatedData} from '../models/paginated-data.model';
import {StringPipe} from '../pipes/string.pipe';
import {TypePipe} from '../pipes/type.pipe';
import {AngminService, DatumMapper} from '../services/angmin.service';
import {NotificationService} from '../services/notification.service';

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
    PageControlComponent,
    ErrorDialogComponent,
    InputSwitchModule,
    InputNumberModule,
    JsonPipe,
    TypePipe,
    CheckboxModule,
    StringPipe,
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.css',
  providers: [ConfirmationService],
})
export class ItemComponent implements OnDestroy {
  server = input.required<string>();
  item = input.required<string>();

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  confirmationService = inject(ConfirmationService);
  notificationService = inject(NotificationService);
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
  protected readonly ColumnType = Type;
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
      .readPaginatedData$(
        this.server(),
        this.item(),
        1 + table.first! / table.rows!,
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

  cancelRefreshData() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Read, true);
  }

  completeRefreshData() {
    this.lastRefresh = new Date();
    this.notificationService.showCompleted(
      TaskType.Read,
      true,
      `Document #: ${this.paginatedData.items}`,
    );
  }

  handleImportData(fileUploadHandlerEvent: FileUploadHandlerEvent) {
    console.log(`Import data: ${fileUploadHandlerEvent}`);
  }

  chooseExportData(type: ActionType) {
    if (type === ActionType.Context) {
      this.taskData = [this.contextDatum];
    } else if (type === ActionType.Selection) {
      this.taskData = this.selectedData;
    } else {
      this.taskData = [];
    }

    this.chooseExportVisible = true;
  }

  chosenExportData(type: ExportType) {
    this.chooseExportVisible = false;
    console.log(`Export data: .${type} ${JSON.stringify(this.taskData)}`);
  }

  confirmDeleteData(type: ActionType) {
    if (type === ActionType.Context) {
      this.taskData = [this.contextDatum];
    } else if (type === ActionType.Selection) {
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
    this.notificationService.showCancelled(TaskType.Delete, false);
  }

  cancelDeleteData() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(
      TaskType.Delete,
      true,
      `Deleted #: ${this.taskCurrent}/${this.taskMax}`,
    );
  }

  completeDeleteData() {
    this.refreshData();
    this.notificationService.showCompleted(
      TaskType.Delete,
      this.taskCurrent === this.taskMax,
      `Deleted #: ${this.taskCurrent}`,
    );
  }

  initEditDatum(datum: Datum) {
    this.clonedData.set(datum.id, {...datum});
  }

  saveEditDatum(datum: Datum) {
    this.clonedData.delete(datum.id);

    // TODO: filter unmodified values
    this.taskData = [datum];

    this.taskMax = 1;
    this.taskCurrent = 0;
    this.taskDatum = datum.id;
    this.taskType = TaskType.Update;
    this.task = from(this.taskData)
      .pipe(
        concatMap((datum) =>
          this.angminService.updatePartialValue$(this.server(), this.item(), datum),
        ),
      )
      .subscribe({
        next: () => ++this.taskCurrent,
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
    this.notificationService.showCancelled(TaskType.Update, false);
  }

  cancelEditData() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(
      TaskType.Update,
      true,
      `Updated #: ${this.taskCurrent}/${this.taskMax}`,
    );
  }

  completeEditData() {
    this.notificationService.showCompleted(TaskType.Update, true, `Updated #: ${this.taskCurrent}`);
  }

  resetTable() {
    this.table().reset();
  }

  removeChipsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.remove();
  }
}
