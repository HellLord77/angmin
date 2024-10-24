import {NgClass} from '@angular/common';
import {Component, input} from '@angular/core';

@Component({
  selector: 'app-icon-label',
  standalone: true,
  imports: [NgClass],
  templateUrl: './icon-label.component.html',
  styleUrl: './icon-label.component.css',
})
export class IconLabelComponent {
  icon = input('');
  spin = input(false);
  label = input('');
  deepClass = input('');
  styleClass = input('');
}
