import {Component, Input, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PrimeTemplate} from 'primeng/api';
import {ChipsModule} from 'primeng/chips';
import {ConfirmDialogModule} from 'primeng/confirmdialog';

import {IconLabelComponent} from '../icon-label/icon-label.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ChipsModule, ConfirmDialogModule, IconLabelComponent, PrimeTemplate, FormsModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  icon = input.required<string>();
  acceptButtonStyleClass = input<string | undefined>(undefined);
  acceptLabel = input<string | undefined>(undefined);
  rejectLabel = input<string | undefined>(undefined);
  headerIcon = input.required<string>();
  headerLabel = input.required<string>();
  @Input({required: true}) items!: unknown[];
  itemsChange = output<unknown[]>();
  itemIcon = input.required<string>();
  itemField = input.required<string>();

  protected removeChipsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.remove();
  }
}
