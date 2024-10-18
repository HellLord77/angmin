import {DatePipe, DecimalPipe, PercentPipe} from '@angular/common';
import {Component, ElementRef, inject, input, OnInit, viewChild} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {map, sum} from 'lodash';
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
import {Item, Items} from '../models/item.model';
import {ServerService} from '../services/server.service';

@Component({
  selector: 'app-server',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    PercentPipe,
    DatePipe,
    TableModule,
    ButtonModule,
    BadgeModule,
    ToolbarModule,
    InputTextModule,
    FileUploadModule,
    SplitButtonModule,
    InputGroupModule,
    InputGroupAddonModule,
    DialogModule,
    ContextMenuModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './server.component.html',
  styleUrl: './server.component.css',
  providers: [MessageService, ConfirmationService],
})
export class ServerComponent implements OnInit {
  server = input.required<string>();

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  serverService = inject(ServerService);

  searchElementRef = viewChild.required<ElementRef<HTMLInputElement>>('search');
  table = viewChild.required(Table);

  contextModel: MenuItem[] = [
    {
      label: 'View',
      icon: PrimeIcons.EYE,
      command: () =>
        this.router.navigate([this.selectedItem.name], {relativeTo: this.activatedRoute}),
    },
    {separator: true},
    {
      label: 'Export',
      icon: PrimeIcons.DOWNLOAD,
      command: () => this.chooseExportItems([this.selectedItem]),
    },
    {
      label: 'Delete',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteItems([this.selectedItem]),
    },
  ];
  exportModel: MenuItem[] = [
    {
      label: 'Export all',
      icon: PrimeIcons.DOWNLOAD,
      command: () => this.chooseExportItems(this.items),
    },
  ];
  deleteModel: MenuItem[] = [
    {
      label: 'Delete all',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteItems(this.items),
      tooltip: 'All documents in all collections will be deleted',
    },
  ];

  exportVisible = false;
  items: Items = [];
  selectedItems: Items = [];

  itemsTotalLength!: number;
  exportMessage!: string;
  lastRefresh!: Date;
  subscription!: Subscription;
  messageError!: Message[];
  state!: State;
  selectedItem!: Item;
  #exportItems!: Items;

  protected readonly State = State;
  protected readonly ExportType = ExportType;

  ngOnInit() {
    console.log(`Server: ${this.server()}`);

    this.refreshItems();
  }

  refreshItems() {
    this.state = State.Loading;

    this.subscription = this.serverService.getItems$(this.server()).subscribe({
      next: (items) => {
        this.items = items;
        const itemNames = new Set(map(items, 'name'));
        this.selectedItems = this.selectedItems.filter((item) => itemNames.has(item.name));
        this.itemsTotalLength = sum(map(items, 'length'));
        this.lastRefresh = new Date();
        this.messageService.add({
          severity: 'info',
          summary: 'Database loaded',
          detail: `Collections #: ${items.length}`,
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

  clearSearch() {
    this.searchElementRef().nativeElement.value = '';
    this.filterTable('');
  }

  filterTable(value: string) {
    this.table().filter(value, 'name', 'contains');
  }

  resetTable() {
    this.clearSearch();

    const table = this.table();
    table.sortField = 'name';
    table.sortOrder = 1;
    table.sortSingle();
  }

  importItems(fileUploadHandlerEvent: FileUploadHandlerEvent) {
    console.log(`Import items: ${fileUploadHandlerEvent}`);
  }

  exportItems(exportType: ExportType) {
    this.exportVisible = false;
    console.log(`Export items: .${exportType} ${JSON.stringify(this.#exportItems)}`);
  }

  chooseExportItems(items: Items) {
    this.#exportItems = items;
    this.exportMessage = `Collections: ${map(items, 'name').join(', ')}`;
    this.exportVisible = true;
  }

  #deleteItems(items: Items) {
    console.log(`Delete items: ${JSON.stringify(items)}`);
  }

  confirmDeleteItems(items: Items) {
    this.confirmationService.confirm({
      message: `Collections: ${map(items, 'name').join(', ')}`,
      accept: () => this.#deleteItems(items),
      reject: () => this.messageService.add({severity: 'info', summary: 'Delete cancelled'}),
    });
  }
}
