import {Component} from '@angular/core';
import {heartBeatAnimation} from 'angular-animations';
import {PrimeIcons} from 'primeng/api';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  host: {
    class:
      'container align-items-center m-3 p-2 pl-3 fixed bottom-0 left-0 surface-hover border-round shadow-5 font-bold select-none',
  },
  animations: [heartBeatAnimation({delay: 1000})],
})
export class FooterComponent {
  protected animationState = false;

  protected readonly PrimeIcons = PrimeIcons;
}
