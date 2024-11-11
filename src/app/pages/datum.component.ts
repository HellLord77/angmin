import '@codemirror/lang-json';

import {AfterViewInit, Component, inject, input, OnDestroy, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, PrimeIcons} from 'primeng/api';
import {Button} from 'primeng/button';
import {FileUploadModule} from 'primeng/fileupload';
import {PanelModule} from 'primeng/panel';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ToolbarModule} from 'primeng/toolbar';
import {NEVER} from 'rxjs';

import {ConfirmDialogComponent} from '../components/confirm-dialog.component';
import {EditorComponent} from '../components/editor.component';
import {ErrorDialogComponent} from '../components/error-dialog.component';
import {IconLabelComponent} from '../components/icon-label.component';
import {PageControlComponent} from '../components/page-control.component';
import {ProgressDialogComponent} from '../components/progress-dialog.component';
import {TableComponent} from '../components/table.component';
import {TaskType} from '../enums/task-type';
import {Datum} from '../models/datum.model';
import {AngminService} from '../services/angmin.service';
import {NotificationService} from '../services/notification.service';

@Component({
  selector: 'app-datum',
  standalone: true,
  imports: [
    ErrorDialogComponent,
    ConfirmDialogComponent,
    ProgressDialogComponent,
    PanelModule,
    ToolbarModule,
    Button,
    FileUploadModule,
    IconLabelComponent,
    PageControlComponent,
    SelectButtonModule,
    TableComponent,
    EditorComponent,
    FormsModule,
  ],
  templateUrl: './datum.component.html',
  styleUrl: './datum.component.css',
  host: {class: 'h-full block'},
  providers: [ConfirmationService],
})
export class DatumComponent implements AfterViewInit, OnDestroy {
  server = input.required<string>();
  item = input.required<string>();
  datum = input.required<string>();

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  confirmationService = inject(ConfirmationService);
  notificationService = inject(NotificationService);
  angminService = inject(AngminService);

  tableComponent = viewChild.required(TableComponent);
  editorComponent = viewChild.required(EditorComponent);

  editOptions = [
    {label: 'Simple', value: true, icon: PrimeIcons.PEN_TO_SQUARE},
    {label: 'Advanced', value: false, icon: PrimeIcons.FILE_EDIT},
  ];
  editorHidden = true;

  lastError?: Error;
  lastRefresh?: Date;

  taskType = TaskType.Read;
  task = NEVER.subscribe();

  value: Datum = {id: ''};

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly TaskType = TaskType;

  ngAfterViewInit() {
    this.refreshValue();
  }

  ngOnDestroy() {
    this.task.unsubscribe();
  }

  refreshValue() {
    this.lastError = undefined;

    this.taskType = TaskType.Read;
    this.task = this.angminService.readValue$(this.server(), this.item(), this.datum()).subscribe({
      next: (value) => {
        this.value = value;
      },
      error: (error) => {
        this.lastError = error;
      },
      complete: () => this.completeRefreshItems(),
    });
  }

  cancelRefreshValue() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Read, true);
  }

  completeRefreshItems() {
    this.lastRefresh = new Date();
    this.notificationService.showCompleted(TaskType.Read, true);
  }

  confirmDeleteValue() {
    this.confirmationService.confirm({
      key: 'delete',
      icon: PrimeIcons.TRASH,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.acceptDeleteValue(),
      reject: () => this.rejectDeleteValue(),
    });
  }

  acceptDeleteValue() {
    this.taskType = TaskType.Delete;
    this.task = this.angminService
      .deleteValue$(this.server(), this.item(), this.datum())
      .subscribe({
        error: (error) => {
          this.lastError = error;
        },
        complete: () => this.completeDeleteData(),
      });
  }

  rejectDeleteValue() {
    this.notificationService.showCancelled(TaskType.Delete, false);
  }

  cancelDeleteValue() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Delete, true);
  }

  completeDeleteData() {
    this.router.navigate(['../'], {relativeTo: this.activatedRoute}).then();
    this.notificationService.showCompleted(TaskType.Delete, true);
  }

  confirmSaveValue() {
    this.confirmationService.confirm({
      key: 'update',
      icon: PrimeIcons.SAVE,
      acceptLabel: 'Save',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.acceptSaveValue(),
      reject: () => this.rejectSaveValue(),
    });
  }

  acceptSaveValue() {
    this.tabChange(true);

    this.taskType = TaskType.Update;
    this.task = this.angminService.updateValue$(this.server(), this.item(), this.value).subscribe({
      error: (error) => {
        this.lastError = error;
      },
      complete: () => this.completeSaveValue(),
    });
  }

  rejectSaveValue() {
    this.notificationService.showCancelled(TaskType.Update, false);
  }

  cancelSaveValue() {
    this.task.unsubscribe();
    this.notificationService.showCancelled(TaskType.Update, true);
  }

  completeSaveValue() {
    this.notificationService.showCompleted(TaskType.Update, true);
  }

  tabChange(saving = false) {
    if (saving !== this.editorHidden) {
      this.value = this.editorComponent().getValue();
    } else {
      this.value = this.tableComponent().getValue();
    }
  }
}
