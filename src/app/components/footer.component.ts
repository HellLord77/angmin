import {Component} from '@angular/core';
import {PrimeIcons} from 'primeng/api';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  host: {
    class:
      'container align-items-center m-4 p-2 pl-3 fixed bottom-0 left-0 bg-blue-900 border-round shadow-5 font-bold',
  },
})
export class FooterComponent {
  protected readonly PrimeIcons = PrimeIcons;
}
