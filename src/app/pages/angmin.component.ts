import {AfterViewInit, Component, ElementRef, inject, viewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, MenuItem, PrimeIcons} from 'primeng/api';
import {ContextMenuModule} from 'primeng/contextmenu';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {SplitButtonModule} from 'primeng/splitbutton';
import {Table, TableModule} from 'primeng/table';
import {ToolbarModule} from 'primeng/toolbar';

import {ConfirmDialogComponent} from '../components/confirm-dialog.component';
import {ExportDialogComponent} from '../components/export-dialog.component';
import {IconLabelComponent} from '../components/icon-label.component';
import {IconTableHeaderComponent} from '../components/icon-table-header.component';
import {PageControlComponent} from '../components/page-control.component';
import {ActionType} from '../enums/action-type';
import {ExportType} from '../enums/export-type';
import {Server} from '../models/server.model';
import {AngminService} from '../services/angmin.service';

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
  ],
  templateUrl: './angmin.component.html',
  styleUrl: './angmin.component.css',
  providers: [ConfirmationService],
})
export class AngminComponent implements AfterViewInit {
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  confirmationService = inject(ConfirmationService);
  angminService = inject(AngminService);

  searchElementRef = viewChild.required<ElementRef<HTMLInputElement>>('search');
  table = viewChild.required(Table);

  confirmExportVisible = false;

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

  servers: Server[] = [];
  selectedServers: Server[] = [];
  taskServers: Server[] = [];
  contextServer!: Server;

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly ActionType = ActionType;

  ngAfterViewInit() {
    Promise.resolve().then(() => this.refreshServers());
  }

  refreshServers() {
    this.servers = this.angminService.getServers();
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
    console.log('acceptDeleteServers');
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
}
