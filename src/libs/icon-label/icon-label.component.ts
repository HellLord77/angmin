import {Component, input} from '@angular/core';

@Component({
  selector: 'app-icon-label',
  standalone: true,
  imports: [],
  templateUrl: './icon-label.component.html',
  styleUrl: './icon-label.component.css',
})
export class IconLabelComponent {
  iconLeft = input('', {alias: 'icon'});
  label = input('');
  iconRight = input('');
  styleClass = input('');
}
