import {AfterViewInit, Component, ElementRef, inject, OnDestroy, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, MenuItem, PrimeIcons} from 'primeng/api';
import {BlockUIModule} from 'primeng/blockui';
import {CardModule} from 'primeng/card';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputTextModule} from 'primeng/inputtext';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {SelectButtonModule} from 'primeng/selectbutton';
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {ToolbarModule} from 'primeng/toolbar';
import {NEVER} from 'rxjs';

import {ConfirmDialogComponent} from '../components/confirm-dialog.component';
import {ExportDialogComponent} from '../components/export-dialog.component';
import {IconLabelComponent} from '../components/icon-label.component';
import {IconTableHeaderComponent} from '../components/icon-table-header.component';
import {PageControlComponent} from '../components/page-control.component';
import {ActionType} from '../enums/action-type';
import {ExportType} from '../enums/export-type';
import {Scheme} from '../enums/scheme';
import {TaskType} from '../enums/task-type';
import {Option} from '../models/option.model';
import {Server} from '../models/server.model';
import {AngminService} from '../services/angmin.service';
import {StorageService} from '../services/storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ExportDialogComponent,
    ConfirmDialogComponent,
    ContextMenuModule,
    TableModule,
    ToolbarModule,
    SplitButtonModule,
    InputGroupModule,
    IconLabelComponent,
    InputGroupAddonModule,
    PageControlComponent,
    FileUploadModule,
    IconTableHeaderComponent,
    InputTextModule,
    DialogModule,
    FormsModule,
    InputNumberModule,
    SelectButtonModule,
    BlockUIModule,
    ProgressSpinnerModule,
    CardModule,
    TagModule,
  ],
  templateUrl: './angmin.component.html',
  styleUrl: './angmin.component.css',
  providers: [ConfirmationService],
})
export class AngminComponent implements AfterViewInit, OnDestroy {
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  confirmationService = inject(ConfirmationService);
  storageService = inject(StorageService);
  angminService = inject(AngminService);

  searchElementRef = viewChild.required<ElementRef<HTMLInputElement>>('search');
  table = viewChild.required(Table);

  contextMenu: MenuItem[] = [
    {
      label: 'View',
      icon: PrimeIcons.EYE,
      command: () =>
        this.router.navigate([this.contextServer.alias], {relativeTo: this.activatedRoute}),
    },
    {separator: true},
    {
      label: 'Export',
      icon: PrimeIcons.UPLOAD,
      command: () => this.chooseExportServers(ActionType.Context),
    },
    {
      label: 'Delete',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteServers(ActionType.Context),
    },
  ];
  exportMenu: MenuItem[] = [
    {
      label: 'Export all',
      icon: PrimeIcons.UPLOAD,
      command: () => this.chooseExportServers(ActionType.All),
    },
  ];
  deleteMenu: MenuItem[] = [
    {
      label: 'Delete all',
      icon: PrimeIcons.TRASH,
      command: () => this.confirmDeleteServers(ActionType.All),
    },
  ];
  schemeOptions: Option<Scheme>[] = [
    {label: 'HTTP', icon: PrimeIcons.LOCK_OPEN, value: Scheme.HTTP},
    {label: 'HTTPS', icon: PrimeIcons.LOCK, value: Scheme.HTTPS},
  ];

  confirmExportVisible = false;
  addServerVisible = false;

  taskType = TaskType.Read;
  task = NEVER.subscribe();

  servers: Server[] = [];
  selectedServers: Server[] = [];
  taskServers: Server[] = [];
  contextServer!: Server;
  addServerPartial!: Partial<Server>;

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly ActionType = ActionType;
  protected readonly TaskType = TaskType;

  ngAfterViewInit() {
    Promise.resolve().then(() => this.refreshServers());
  }

  ngOnDestroy() {
    this.task.unsubscribe();
  }

  refreshServers() {
    this.servers = this.storageService.getServers();
  }

  handleImportServers(fileUploadHandlerEvent: FileUploadHandlerEvent) {
    console.log(`Import servers: ${fileUploadHandlerEvent}`);
  }

  chooseExportServers(type: ActionType) {
    if (type === ActionType.Context) {
      this.taskServers = [this.contextServer];
    } else if (type === ActionType.Select) {
      this.taskServers = [...this.selectedServers];
    } else {
      this.taskServers = [...this.servers];
    }

    this.confirmExportVisible = true;
  }

  confirmExportServers(exportType: ExportType) {
    this.confirmExportVisible = false;

    console.log(`Export servers: ${exportType} ${JSON.stringify(this.taskServers)}`);
  }

  initAddServer() {
    this.addServerPartial = {alias: '', scheme: Scheme.HTTP};
    this.addServerVisible = true;
  }

  cancelAddServer() {
    this.task.unsubscribe();
    this.addServerVisible = false;
  }

  saveAddServer() {
    this.taskType = TaskType.Create;
    this.task = this.angminService.createServer$(this.addServerPartial).subscribe({
      next: () => {
        this.addServerVisible = false;
        this.refreshServers();
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  confirmDeleteServers(type: ActionType) {
    if (type === ActionType.Context) {
      this.taskServers = [this.contextServer];
    } else if (type === ActionType.Select) {
      this.taskServers = [...this.selectedServers];
    } else {
      this.taskServers = [...this.servers];
    }

    this.confirmationService.confirm({
      key: 'delete',
      icon: PrimeIcons.TRASH,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.acceptDeleteServers(),
    });
  }

  acceptDeleteServers() {
    this.storageService.delServers(this.taskServers.map((server) => server.alias));
    this.refreshServers();
  }

  filterTable(value: string) {
    this.table().filter(value, 'alias', 'contains');
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

  protected readonly Scheme = Scheme;
}
