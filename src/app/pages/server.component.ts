import {DatePipe, DecimalPipe, PercentPipe} from '@angular/common';
import {Component, ElementRef, inject, input, OnDestroy, OnInit, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ConfirmationService, MenuItem, PrimeIcons} from 'primeng/api';
import {BadgeModule} from 'primeng/badge';
import {ButtonModule} from 'primeng/button';
import {ChipsModule} from 'primeng/chips';
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
import {ToolbarModule} from 'primeng/toolbar';
import {NEVER} from 'rxjs';

import {ConfirmDialogComponent} from '../components/confirm-dialog.component';
import {ErrorDialogComponent} from '../components/error-dialog.component';
import {IconLabelComponent} from '../components/icon-label.component';
import {IconTableHeaderComponent} from '../components/icon-table-header.component';
import {PageControlComponent} from '../components/page-control.component';
import {ProgressDialogComponent} from '../components/progress-dialog.component';
import {ActionType} from '../enums/action-type';
import {ExportType} from '../enums/export-type';
import {TaskType} from '../enums/task-type';
import {Item} from '../models/item.model';
import {AngminService, DatumMapper} from '../services/angmin.service';
import {NotificationService} from '../services/notification.service';

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
    PanelModule,
    DividerModule,
    ChipsModule,
    FormsModule,
    ProgressSpinnerModule,
    IconLabelComponent,
    IconTableHeaderComponent,
    ConfirmDialogComponent,
    ProgressDialogComponent,
    PageControlComponent,
    ErrorDialogComponent,
  ],
  templateUrl: './server.component.html',
  styleUrl: './server.component.css',
  providers: [ConfirmationService],
})
export class ServerComponent implements OnInit, OnDestroy {
  server = input.required<string>();

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  confirmationService = inject(ConfirmationService);
  notificationService = inject(NotificationService);
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
    },
  ];

  chooseExportVisible = false;
  lastError?: Error;
  lastRefresh?: Date;

  taskType = TaskType.Read;
  task = NEVER.subscribe();
  taskMax = 0;
  taskCurrent = 0;
  taskItem = '...';
  taskDatum = '...';

  items: Item[] = [];
  selectedItems: Item[] = [];
  taskItems: Item[] = [];
  contextItem!: Item;

  itemsTotalLength!: number;

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly ActionType = ActionType;
  protected readonly TaskType = TaskType;
  protected readonly ExportType = ExportType;

  ngOnInit() {
    this.refreshItems();
  }

  ngOnDestroy() {
    this.task.unsubscribe();
  }

  refreshItems() {
    this.lastError = undefined;

    this.taskType = TaskType.Read;
    this.task = this.angminService.readItems$(this.server()).subscribe({
      next: (items) => {
        this.items = items;
        this.itemsTotalLength = items.reduce((total, item) => total + item.length, 0);
        const itemNames = new Set(items.map((item) => item.name));
        this.selectedItems = this.selectedItems.filter((item) => itemNames.has(item.name));
      },
      error: (error) => {
        this.lastError = error;
      },
      complete: () => this.completeRefreshItems(),
    });
  }

  cancelRefreshItems() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Read, true);
  }

  completeRefreshItems() {
    this.lastRefresh = new Date();
    this.notificationService.showCompleted(
      TaskType.Read,
      true,
      `Collection #: ${this.items.length}`,
    );
  }

  handleImportItems(fileUploadHandlerEvent: FileUploadHandlerEvent) {
    console.log(`Import items: ${fileUploadHandlerEvent}`);
  }

  chooseExportItems(type: ActionType) {
    if (type === ActionType.Context) {
      this.taskItems = [this.contextItem];
    } else if (type === ActionType.Selection) {
      this.taskItems = [...this.selectedItems];
    } else {
      this.taskItems = [...this.items];
    }

    this.chooseExportVisible = true;
  }

  chosenExportItems(type: ExportType) {
    this.chooseExportVisible = false;
    console.log(`Export items: .${type} ${JSON.stringify(this.taskItems)}`);
  }

  confirmDeleteItems(type: ActionType) {
    if (type === ActionType.Context) {
      this.taskItems = [this.contextItem];
    } else if (type === ActionType.Selection) {
      this.taskItems = [...this.selectedItems];
    } else {
      this.taskItems = [...this.items];
    }

    this.confirmationService.confirm({
      key: 'delete',
      icon: PrimeIcons.TRASH,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.acceptDeleteItems(),
      reject: () => this.rejectDeleteItems(),
    });
  }

  acceptDeleteItems() {
    const datumMapper: DatumMapper = (server, item, datum) => {
      this.taskItem = item;
      this.taskDatum = datum;
      return this.angminService.deleteValue$(server, item, datum);
    };

    this.taskMax = this.taskItems.reduce((total, item) => total + item.length, 0);
    this.taskCurrent = 0;
    this.taskDatum = '...';
    this.taskType = TaskType.Delete;
    this.task = this.angminService
      .mapItemsData$(
        this.server(),
        this.taskItems.map((item) => item.name),
        datumMapper,
      )
      .subscribe({
        next: () => ++this.taskCurrent,
        error: (error) => {
          this.lastError = error;
        },
        complete: () => this.completeDeleteItems(),
      });
  }

  rejectDeleteItems() {
    this.notificationService.showCancelled(TaskType.Delete, false);
  }

  cancelDeleteItems() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(
      TaskType.Delete,
      true,
      `Deleted #: ${this.taskCurrent}/${this.taskMax}`,
    );
  }

  completeDeleteItems() {
    this.refreshItems();
    this.notificationService.showCompleted(
      TaskType.Delete,
      this.taskCurrent === this.taskMax,
      `Deleted #: ${this.taskCurrent}`,
    );
  }

  filterTable(value: string) {
    this.table().filter(value, 'name', 'contains');
  }

  clearSearch() {
    this.searchElementRef().nativeElement.value = '';
    this.filterTable('');
  }

  resetTable() {
    this.clearSearch();

    const table = this.table();
    table.sortField = 'name';
    table.sortOrder = 1;
    table.sortSingle();
  }

  removeChipsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.remove();
  }
}
