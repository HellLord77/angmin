import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {PrimeNGConfig} from 'primeng/api';

import {FooterComponent} from './components/footer.component';
import {HeaderComponent} from './components/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'angmin';

  primeNGConfig = inject(PrimeNGConfig);

  constructor() {
    this.primeNGConfig.ripple = true;
    this.primeNGConfig.filterMatchModeOptions['text'] =
      this.primeNGConfig.filterMatchModeOptions['numeric'];
  }
}
