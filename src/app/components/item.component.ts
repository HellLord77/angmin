import {DatePipe} from '@angular/common';
import {Component, inject, input, OnInit, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {flatten, keys, map} from 'lodash';
import {ConfirmationService, MenuItem, Message, MessageService, PrimeIcons} from 'primeng/api';
import {BadgeModule} from 'primeng/badge';
import {ButtonModule} from 'primeng/button';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {MultiSelectModule} from 'primeng/multiselect';
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
  lastRefresh!: Date;
  subscription!: Subscription;
  messageError!: Message[];
  state!: State;
  selectedDatum!: Datum;

  selectedColumns?: string[];

  #exportData?: Datum[];

  protected readonly State = State;
  protected readonly ActionType = ActionType;
  protected readonly ExportType = ExportType;

  ngOnInit() {
    console.log(`Item: ${this.server()}, ${this.item()}`);

    this.refreshData();
  }

  refreshData() {
    this.state = State.Loading;

    const table = this.table();
    const rows = table.rows ?? 10;
    this.subscription = this.angminService
      .getPaginatedData$(
        this.server(),
        this.item(),
        (table.first ?? 0) / rows + 1,
        rows,
        table.multiSortMeta ?? [],
      )
      .subscribe({
        next: (paginatedData) => {
          this.paginatedData = paginatedData;
          const columns = new Set(flatten(paginatedData.data.map((datum) => keys(datum))));
          columns.delete('id');
          this.columns = [...columns];
          this.selectedColumns = [...columns];
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
          this.messageError = [{severity: 'error', summary: error.name, detail: error.message}];
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
      this.exportMessage = `You are about to export the following datum: ${this.selectedDatum.id}. `;
    } else if (actionType === ActionType.Selection) {
      this.#exportData = this.selectedData;
      this.exportMessage = `You are about to export the selected datum/data: ${map(this.selectedData, 'id')}. `;
    } else {
      this.#exportData = undefined;
      this.exportMessage = `You are about to export all the data in the collection. `;
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
      message = `You are about to delete the following data: ${this.selectedDatum.id}. `;
    } else if (actionType === ActionType.Selection) {
      data = this.selectedData;
      message = `You are about to delete the selected datum/data: ${map(this.selectedData, 'id')}. `;
    } else {
      message = `You are about to delete all the data in the collection. `;
    }
    message += 'Are you sure?';

    this.confirmationService.confirm({
      message: message,
      accept: () => this.#deleteData(data),
      reject: () => this.messageService.add({severity: 'info', summary: 'Delete cancelled'}),
    });
  }

  cancelEditData() {
    this.messageService.add({severity: 'info', summary: 'Edit cancelled'});
  }
}
