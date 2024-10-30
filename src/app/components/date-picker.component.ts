import {DatePipe} from '@angular/common';
import {Component, inject, output} from '@angular/core';
import {PrimeIcons} from 'primeng/api';
import {ButtonDirective} from 'primeng/button';
import {CalendarModule} from 'primeng/calendar';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputTextModule} from 'primeng/inputtext';
import {PaginatorModule} from 'primeng/paginator';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ToggleButtonModule} from 'primeng/togglebutton';

import {DateFormat} from '../enums/date-format';
import {DateMode} from '../enums/date-mode';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    ButtonDirective,
    InputGroupModule,
    InputTextModule,
    PaginatorModule,
    SelectButtonModule,
    CalendarModule,
    ToggleButtonModule,
  ],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.css',
  host: {class: 'container flex-column align-items-center'},
  providers: [DatePipe],
})
export class DatePickerComponent {
  datePick = output<string>();

  datePipe = inject(DatePipe);

  protected date = new Date();

  protected modes = Object.values(DateMode);
  protected modeOptions = Object.entries(DateMode);
  protected format = DateFormat.Full;
  protected formatOptions = Object.entries(DateFormat);

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly DateMode = DateMode;

  protected getValue() {
    let format = this.format.toString();
    if (this.modes.length !== 2) {
      format = `${format}${this.modes[0]}`;
    }

    return this.datePipe.transform(this.date, format)!;
  }
}
