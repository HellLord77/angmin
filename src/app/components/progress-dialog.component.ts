import {DecimalPipe} from '@angular/common';
import {Component, input, output} from '@angular/core';
import {PrimeIcons, PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {DividerModule} from 'primeng/divider';
import {ProgressBarModule} from 'primeng/progressbar';

import {IconLabelComponent} from './icon-label.component';
import {PageInfoComponent} from './page-info.component';

@Component({
  selector: 'app-progress-dialog',
  standalone: true,
  imports: [
    Button,
    DecimalPipe,
    DialogModule,
    DividerModule,
    IconLabelComponent,
    PrimeTemplate,
    ProgressBarModule,
    PageInfoComponent,
  ],
  templateUrl: './progress-dialog.component.html',
  styleUrl: './progress-dialog.component.css',
})
export class ProgressDialogComponent {
  server = input.required<string>();
  item = input<string>();
  datum = input<string>();
  visible = input.required<boolean>();
  headerIcon = input(PrimeIcons.SPINNER_DOTTED);
  headerLabel = input.required<string>();
  progressMax = input<number>(0);
  progressIcon = input<string>();
  progress = input<number>(0);
  cancelDisabled = input<boolean>(false);
  onCancel = output();

  protected readonly PrimeIcons = PrimeIcons;

  protected getProgressValue() {
    return Math.round((this.progress() / this.progressMax()) * 100);
  }
}
