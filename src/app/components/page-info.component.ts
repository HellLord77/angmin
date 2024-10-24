import {NgClass} from '@angular/common';
import {Component, input} from '@angular/core';
import {PrimeIcons} from 'primeng/api';
import {CardModule} from 'primeng/card';

import {IconLabelComponent} from '../icon-label.component';

@Component({
  selector: 'app-page-info',
  standalone: true,
  imports: [IconLabelComponent, CardModule, NgClass],
  templateUrl: './page-info.component.html',
  styleUrl: './page-info.component.css',
})
export class PageInfoComponent {
  server = input.required<string>();
  item = input<string>();
  datum = input<string>();
  center = input(false);

  protected readonly PrimeIcons = PrimeIcons;
}
