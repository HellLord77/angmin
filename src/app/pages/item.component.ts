import {Component, inject, input, OnDestroy, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {pluralize} from 'inflection';
import {
  ConfirmationService,
  FilterMatchMode,
  FilterMetadata,
  MenuItem,
  PrimeIcons,
  SelectItem,
} from 'primeng/api';
import {Button} from 'primeng/button';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputSwitchModule} from 'primeng/inputswitch';
import {InputTextModule} from 'primeng/inputtext';
import {MultiSelectModule} from 'primeng/multiselect';
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {ToolbarModule} from 'primeng/toolbar';
import {concatMap, from, NEVER, Observable} from 'rxjs';

import {ConfirmDialogComponent} from '../components/confirm-dialog.component';
import {ErrorDialogComponent} from '../components/error-dialog.component';
import {ExportDialogComponent} from '../components/export-dialog.component';
import {IconLabelComponent} from '../components/icon-label.component';
import {IconTableHeaderComponent} from '../components/icon-table-header.component';
import {PageControlComponent} from '../components/page-control.component';
import {ProgressDialogComponent} from '../components/progress-dialog.component';
import {TreeTableComponent} from '../components/tree-table.component';
import {ActionType} from '../enums/action-type';
import {ExportType} from '../enums/export-type';
import {TaskType} from '../enums/task-type';
import {Type} from '../enums/type';
import {columnsToValue} from '../functions/columnsToValue';
import {typeOf} from '../functions/typeOf';
import {Column} from '../models/column.model';
import {Datum} from '../models/datum.model';
import {PaginatedData} from '../models/paginated-data.model';
import {StringPipe} from '../pipes/string.pipe';
import {AngminService, DatumMapper} from '../services/angmin.service';
import {NotificationService} from '../services/notification.service';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    ProgressDialogComponent,
    ContextMenuModule,
    TableModule,
    ExportDialogComponent,
    ErrorDialogComponent,
    DialogModule,
    IconTableHeaderComponent,
    Button,
    InputSwitchModule,
    TagModule,
    StringPipe,
    IconLabelComponent,
    InputNumberModule,
    FormsModule,
    ToolbarModule,
    PageControlComponent,
    MultiSelectModule,
    SplitButtonModule,
    FileUploadModule,
    TreeTableComponent,
    InputTextModule,
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

  stringMatchModeOptions: SelectItem[] = [
    {label: 'Equals', value: FilterMatchMode.EQUALS},
    {label: 'Not equals', value: FilterMatchMode.NOT_EQUALS},
  ];

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
      command: () => this.chooseExportData(ActionType.All),
    },
  ];
  deleteMenu: MenuItem[] = [
    {
      label: 'Delete all',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteData(ActionType.All),
    },
  ];

  confirmExportVisible = false;
  addDatumVisible = false;
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
  addDatumColumns: Column[] = [];

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

  protected readonly FilterMatchMode = FilterMatchMode;
  protected readonly PrimeIcons = PrimeIcons;
  protected readonly Type = Type;
  protected readonly ActionType = ActionType;
  protected readonly TaskType = TaskType;
  protected readonly typeOf = typeOf;

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
        table.filters as Record<string, FilterMetadata[]>,
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
    } else if (type === ActionType.Select) {
      this.taskData = this.selectedData;
    } else {
      this.taskData = [];
    }

    this.confirmExportVisible = true;
  }

  confirmExportData(type: ExportType) {
    this.confirmExportVisible = false;

    console.log(`Export data: .${type} ${JSON.stringify(this.taskData)}`);
  }

  initAddDatum() {
    this.addDatumColumns = [{name: 'id', type: Type.String, value: '...'}];
    this.addDatumVisible = true;
  }

  saveAddDatum() {
    this.addDatumVisible = false;
    const datum = columnsToValue(this.addDatumColumns) as unknown as Datum;

    this.taskData = [datum];

    this.taskMax = 1;
    this.taskCurrent = 0;
    this.taskDatum = datum.id;
    this.taskType = TaskType.Create;
    this.task = from(this.taskData)
      .pipe(concatMap((datum) => this.angminService.createData$(this.server(), this.item(), datum)))
      .subscribe({
        next: () => ++this.taskCurrent,
        error: (error) => {
          this.lastError = error;
        },
        complete: () => this.completeSaveDatum(),
      });
  }

  cancelSaveDatum() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Create, true);
  }

  completeSaveDatum() {
    this.refreshData();
    this.notificationService.showCompleted(TaskType.Create, true);
  }

  confirmDeleteData(type: ActionType) {
    if (type === ActionType.Context) {
      this.taskData = [this.contextDatum];
    } else if (type === ActionType.Select) {
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
    this.notificationService.showCancelled(TaskType.Update, true);
  }

  completeEditData() {
    this.notificationService.showCompleted(TaskType.Update, true);
  }

  resetTable() {
    this.table().reset();
  }
}
