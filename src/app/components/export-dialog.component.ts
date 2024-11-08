import {Component, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PrimeIcons, PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {ChipsModule} from 'primeng/chips';
import {DialogModule} from 'primeng/dialog';

import {ExportType} from '../enums/export-type';
import {IconLabelComponent} from './icon-label.component';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [FormsModule, Button, ChipsModule, DialogModule, IconLabelComponent, PrimeTemplate],
  templateUrl: './export-dialog.component.html',
  styleUrl: './export-dialog.component.css',
})
export class ExportDialogComponent {
  visible = input.required<boolean>();
  visibleChange = output();
  headerLabel = input.required<string>();
  items = input.required<unknown[]>();
  itemsChange = output<unknown[]>();
  itemIcon = input.required<string>();
  itemField = input.required<string>();
  onConfirm = output<ExportType>();

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly ExportType = ExportType;

  protected removeChipsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.remove();
  }
}
