import {Component, input} from '@angular/core';
import {TableModule} from 'primeng/table';

import {IconLabelComponent} from '../icon-label/icon-label.component';

@Component({
  selector: 'app-icon-table-header',
  standalone: true,
  imports: [IconLabelComponent, TableModule],
  templateUrl: './icon-table-header.component.html',
  styleUrl: './icon-table-header.component.css',
})
export class IconTableHeaderComponent {
  icon = input('');
  label = input('');
  sortField = input('');
}
