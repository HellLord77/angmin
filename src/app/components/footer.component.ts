import {Component} from '@angular/core';
import {PrimeIcons} from 'primeng/api';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  protected readonly PrimeIcons = PrimeIcons;
}
