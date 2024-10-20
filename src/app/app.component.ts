import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {SidebarModule} from 'primeng/sidebar';

import {FooterComponent} from './components/footer.component';
import {HeaderComponent} from './components/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SidebarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'angmin';
}
