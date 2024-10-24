import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';

import {AngminService} from '../services/angmin.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './angmin.component.html',
  styleUrl: './angmin.component.css',
})
export class AngminComponent {
  angminService = inject(AngminService);
}
