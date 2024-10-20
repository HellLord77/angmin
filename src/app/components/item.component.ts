import {DatePipe} from '@angular/common';
import {Component, inject, input, OnInit, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {clone, findIndex, flatten, keys, map} from 'lodash';
import {ConfirmationService, MenuItem, MessageService, PrimeIcons} from 'primeng/api';
import {BadgeModule} from 'primeng/badge';
import {ButtonModule} from 'primeng/button';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {DividerModule} from 'primeng/divider';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {MultiSelectModule} from 'primeng/multiselect';
import {PanelModule} from 'primeng/panel';
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {ToolbarModule} from 'primeng/toolbar';
import {Subscription} from 'rxjs';

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
    InputTextModule,
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
    ConfirmDialogModule,
    MultiSelectModule,
    FormsModule,
    PanelModule,
    DividerModule,
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.css',
  providers: [MessageService, ConfirmationService],
})
export class ItemComponent implements OnInit {
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
        this.router.navigate([this.selectedDatum.id], {relativeTo: this.activatedRoute}),
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
      tooltip: 'All documents will be deleted',
    },
  ];

  exportVisible = false;
  state = State.Loading;
  clonedData = new Map<string, Datum>();
  columns: string[] = [];
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

  exportMessage!: string;
  lastError!: Error;
  subscription!: Subscription;
  selectedDatum!: Datum;

  lastRefresh?: Date;
  selectedColumns?: string[];

  #exportData?: Datum[];

  protected readonly State = State;
  protected readonly ActionType = ActionType;
  protected readonly ExportType = ExportType;

  ngOnInit() {
    console.log(`Item: ${this.server()}, ${this.item()}`);
  }

  refreshData() {
    const table = this.table();

    this.state = State.Loading;
    for (const datum of this.clonedData.values()) {
      table.cancelRowEdit(datum);
    }
    this.clonedData.clear();

    this.subscription = this.angminService
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
    this.subscription?.unsubscribe();
    this.state = State.Cancelled;
  }

  resetTable() {
    this.table().reset();
  }

  importData(fileUploadHandlerEvent: FileUploadHandlerEvent) {
    console.log(`Import data: ${fileUploadHandlerEvent}`);
  }

  exportData(exportType: ExportType) {
    this.exportVisible = false;
    console.log(`Export data: .${exportType} ${JSON.stringify(this.#exportData)}`);
  }

  chooseExportData(actionType: ActionType) {
    if (actionType === ActionType.Context) {
      this.#exportData = [this.selectedDatum];
      this.exportMessage = `You are about to export the following document: ${this.selectedDatum.id}. `;
    } else if (actionType === ActionType.Selection) {
      this.#exportData = this.selectedData;
      this.exportMessage = `You are about to export the selected document(s): ${map(this.selectedData, 'id')}. `;
    } else {
      this.#exportData = undefined;
      this.exportMessage = `You are about to export all the documents in the collection. `;
    }
    this.exportMessage += 'Choose exported data format.';
    this.exportVisible = true;
  }

  #deleteData(data?: Datum[]) {
    console.log(`Delete data: ${JSON.stringify(data)}`);
  }

  confirmDeleteData(actionType: ActionType) {
    let data: Datum[];
    let message: string;
    if (actionType === ActionType.Context) {
      data = [this.selectedDatum];
      message = `You are about to delete the following document: ${this.selectedDatum.id}. `;
    } else if (actionType === ActionType.Selection) {
      data = this.selectedData;
      message = `You are about to delete the selected document(s): ${map(this.selectedData, 'id')}. `;
    } else {
      message = `You are about to delete all the documents in the collection. `;
    }
    message += 'Are you sure?';

    this.confirmationService.confirm({
      message: message,
      accept: () => this.#deleteData(data),
      reject: () => this.messageService.add({severity: 'info', summary: 'Delete cancelled'}),
    });
  }

  initEditData(datum: Datum) {
    this.clonedData.set(datum.id, clone(datum));
  }

  saveEditData(datum: Datum) {
    console.log(`Save data: ${JSON.stringify(datum)}`);
  }

  cancelEditData(datum: Datum) {
    const index = findIndex(this.paginatedData.data, ['id', datum.id]);
    this.paginatedData.data[index] = this.clonedData.get(datum.id)!;
    this.clonedData.delete(datum.id);
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
}
