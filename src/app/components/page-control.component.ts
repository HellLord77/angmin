import {DatePipe} from '@angular/common';
import {Component, input, output} from '@angular/core';
import {RouterLink} from '@angular/router';
import {PrimeIcons} from 'primeng/api';
import {BadgeModule} from 'primeng/badge';
import {Button} from 'primeng/button';

@Component({
  selector: 'app-page-control',
  standalone: true,
  imports: [Button, RouterLink, BadgeModule, DatePipe],
  templateUrl: './page-control.component.html',
  styleUrl: './page-control.component.css',
  host: {class: 'container justify-content-end'},
})
export class PageControlComponent {
  backDisabled = input(false);
  refreshOutlined = input(false);
  lastRefresh = input<Date>();
  onRefresh = output();
  styleClass = input('');

  protected readonly PrimeIcons = PrimeIcons;

  protected getRefreshSeverity() {
    const lastRefresh = this.lastRefresh();
    if (lastRefresh) {
      const delta = new Date().valueOf() - lastRefresh.valueOf();
      if (delta <= 60 * 1000) {
        return 'success';
      } else if (delta <= 3 * 60 * 1000) {
        return 'warning';
      } else {
        return 'danger';
      }
    } else {
      return undefined;
    }
  }
}
