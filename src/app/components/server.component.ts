import {DatePipe, DecimalPipe, PercentPipe} from '@angular/common';
import {Component, ElementRef, inject, input, OnInit, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {map, sum} from 'lodash';
import {ConfirmationService, MenuItem, MessageService, PrimeIcons} from 'primeng/api';
import {BadgeModule} from 'primeng/badge';
import {ButtonModule} from 'primeng/button';
import {ChipsModule} from 'primeng/chips';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {DividerModule} from 'primeng/divider';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {PanelModule} from 'primeng/panel';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {ToolbarModule} from 'primeng/toolbar';
import {Subscription} from 'rxjs';

import {IconLabelComponent} from '../../libs/icon-label/icon-label.component';
import {IconTableHeaderComponent} from '../../libs/icon-table-header/icon-table-header.component';
import {ActionType} from '../enums/action-type';
import {ExportType} from '../enums/export-type';
import {State} from '../enums/state';
import {Item} from '../models/item.model';
import {AngminService} from '../services/angmin.service';

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
    PanelModule,
    DividerModule,
    ChipsModule,
    FormsModule,
    ProgressSpinnerModule,
    IconLabelComponent,
    IconTableHeaderComponent,
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
  angminService = inject(AngminService);

  searchElementRef = viewChild.required<ElementRef<HTMLInputElement>>('search');
  table = viewChild.required(Table);

  contextMenu: MenuItem[] = [
    {
      label: 'View',
      icon: PrimeIcons.EYE,
      command: () =>
        this.router.navigate([this.contextItem.name], {relativeTo: this.activatedRoute}),
    },
    {separator: true},
    {
      label: 'Export',
      icon: PrimeIcons.UPLOAD,
      command: () => this.chooseExportItems(ActionType.Context),
    },
    {
      label: 'Delete',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteItems(ActionType.Context),
    },
  ];
  exportMenu: MenuItem[] = [
    {
      label: 'Export all',
      icon: PrimeIcons.UPLOAD,
      command: () => this.chooseExportItems(ActionType.Global),
    },
  ];
  deleteMenu: MenuItem[] = [
    {
      label: 'Delete all',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteItems(ActionType.Global),
      tooltip: 'All documents in all collections will be deleted',
    },
  ];

  state = State.Loading;
  chooseExportVisible = false;
  lastError!: Error;
  refreshTask!: Subscription;
  lastRefresh?: Date;

  items: Item[] = [];
  selectedItems: Item[] = [];
  exportItems: Item[] = [];
  deleteItems: Item[] = [];
  contextItem!: Item;

  itemsTotalLength!: number;

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly State = State;
  protected readonly ActionType = ActionType;
  protected readonly ExportType = ExportType;

  ngOnInit() {
    console.log(`Server: ${this.server()}`);

    this.refreshItems();
  }

  refreshItems() {
    this.state = State.Loading;

    this.refreshTask = this.angminService.getItems$(this.server()).subscribe({
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
        this.lastError = error;
        this.state = State.Errored;
      },
    });
  }

  cancelRefresh() {
    this.refreshTask?.unsubscribe();
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

  handleImportItems(fileUploadHandlerEvent: FileUploadHandlerEvent) {
    console.log(`Import items: ${fileUploadHandlerEvent}`);
  }

  chooseExportItems(actionType: ActionType) {
    if (actionType === ActionType.Context) {
      this.exportItems = [this.contextItem];
    } else if (actionType === ActionType.Selection) {
      this.exportItems = [...this.selectedItems];
    } else {
      this.exportItems = [...this.items];
    }

    this.chooseExportVisible = true;
  }

  chosenExportItems(exportType: ExportType) {
    this.chooseExportVisible = false;
    console.log(`Export items: .${exportType} ${JSON.stringify(this.exportItems)}`);
  }

  confirmDeleteItems(actionType: ActionType) {
    if (actionType === ActionType.Context) {
      this.deleteItems = [this.contextItem];
    } else if (actionType === ActionType.Selection) {
      this.deleteItems = [...this.selectedItems];
    } else {
      this.deleteItems = [...this.items];
    }

    this.confirmationService.confirm({
      icon: PrimeIcons.TRASH,
      accept: () => this.acceptDeleteItems(),
      reject: () => this.rejectDeleteItems(),
    });
  }

  acceptDeleteItems() {
    console.log(`Delete items: ${JSON.stringify(this.deleteItems)}`);
  }

  rejectDeleteItems() {
    this.deleteItems = [];
    this.messageService.add({severity: 'info', summary: 'Delete cancelled'});
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

  removeChipsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.remove();
  }
}
