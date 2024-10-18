import {DatePipe} from '@angular/common';
import {Component, inject, input, OnInit, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';
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
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {ToolbarModule} from 'primeng/toolbar';
import {Subscription} from 'rxjs';

import {ExportType} from '../enums/export-type';
import {State} from '../enums/state';
import {Data, Datum} from '../models/datum.model';
import {PaginatedData} from '../models/paginated-data.model';
import {ItemService} from '../services/item.service';

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
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.css',
  providers: [MessageService, ConfirmationService],
})
export class ItemComponent implements OnInit {
  server = input.required<string>();
  item = input.required<string>();

  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  itemService = inject(ItemService);

  table = viewChild.required(Table);

  contextMenu: MenuItem[] = [];
  exportMenu: MenuItem[] = [
    {
      label: 'Export all',
      icon: PrimeIcons.DOWNLOAD,
      command: () => this.chooseExportData(this.paginatedData.data),
    },
  ];
  deleteMenu: MenuItem[] = [
    {
      label: 'Delete all',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteData(this.paginatedData.data),
      tooltip: 'All documents will be deleted',
    },
  ];

  exportVisible = false;
  columns = new Set<string>();
  paginatedData: PaginatedData = {
    first: 0,
    prev: null,
    next: null,
    last: 0,
    pages: 0,
    items: 0,
    data: [],
  };
  selectedData: Data = [];

  exportMessage!: string;
  lastRefresh!: Date;
  subscription!: Subscription;
  messageError!: Message[];
  state!: State;
  selectedDatum!: Datum;
  #exportData!: Data;

  protected readonly State = State;
  protected readonly ExportType = ExportType;

  ngOnInit() {
    console.log(`Item: ${this.server()}, ${this.item()}`);

    this.refreshData();
  }

  refreshData() {
    this.state = State.Loading;

    this.subscription = this.itemService.getData$(this.server(), this.item()).subscribe({
      next: (paginatedData) => {
        this.paginatedData = paginatedData;
        this.columns = new Set(flatten(paginatedData.data.map((datum) => keys(datum))));
        this.columns.delete('id');
        const dataIds = map(paginatedData.data, 'id');
        this.selectedData = this.selectedData.filter((datum) => dataIds.includes(datum.id));
        this.lastRefresh = new Date();
        this.messageService.add({
          severity: 'info',
          summary: 'Database loaded',
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

  chooseExportData(data: Data) {
    this.#exportData = data;
    this.exportMessage = `You are about to export the following data: ${map(data, 'id').join(', ')}. Choose the export format.`;
    this.exportVisible = true;
  }

  #deleteData(data: Data) {
    console.log(`Delete data: ${JSON.stringify(data)}`);
  }

  confirmDeleteData(data: Data) {
    this.confirmationService.confirm({
      message: `You are about to delete the following data: ${map(data, 'id').join(', ')}. Are you sure?`,
      accept: () => this.#deleteData(data),
      reject: () => this.messageService.add({severity: 'info', summary: 'Delete cancelled'}),
    });
  }
}
