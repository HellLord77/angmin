import {inject, Injectable} from '@angular/core';
import {Message, MessageService} from 'primeng/api';

import {TaskType} from '../enums/task-type';
import {ToastSeverity} from '../enums/toast-severity';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  messageService = inject(MessageService);
  storageService = inject(StorageService);

  notifications: Message[] = [];

  #show(message: Message) {
    this.notifications.push(message);
    if (this.storageService.getNotify()) {
      this.messageService.add(message);
    }
  }

  showCancelled(type: TaskType, task: boolean, detail?: string) {
    this.#show({
      severity: task ? ToastSeverity.Error : ToastSeverity.Info,
      summary: `${type} cancelled`,
      detail: detail,
    });
  }

  showCompleted(type: TaskType, success: boolean, detail?: string) {
    this.#show({
      severity: success ? ToastSeverity.Success : ToastSeverity.Warn,
      summary: `${type} completed`,
      detail: detail,
    });
  }
}
