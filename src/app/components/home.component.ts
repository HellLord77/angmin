import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';

import {StorageService} from '../services/storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  storageService = inject(StorageService);
}
