import {Component, input, output} from '@angular/core';
import {PrimeIcons, PrimeTemplate} from 'primeng/api';
import {DialogModule} from 'primeng/dialog';
import {PanelModule} from 'primeng/panel';

import {IconLabelComponent} from '../icon-label.component';
import {PageControlComponent} from './page-control.component';
import {PageInfoComponent} from './page-info.component';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [
    DialogModule,
    IconLabelComponent,
    PageControlComponent,
    PanelModule,
    PrimeTemplate,
    PageInfoComponent,
  ],
  templateUrl: './error-dialog.component.html',
  styleUrl: './error-dialog.component.css',
})
export class ErrorDialogComponent {
  server = input.required<string>();
  item = input<string>();
  datum = input<string>();
  error = input<Error>();
  onRefresh = output();

  protected readonly PrimeIcons = PrimeIcons;
}
