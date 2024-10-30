import {Component, output, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PrimeIcons} from 'primeng/api';
import {ButtonDirective} from 'primeng/button';
import {ColorPicker, ColorPickerModule} from 'primeng/colorpicker';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputTextModule} from 'primeng/inputtext';
import {SelectButtonModule} from 'primeng/selectbutton';

import {ColorFormat} from '../enums/color-format';
import {HSB} from '../models/hsb.model';
import {RGB} from '../models/rgb.model';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [
    ButtonDirective,
    ColorPickerModule,
    InputGroupModule,
    InputTextModule,
    SelectButtonModule,
    FormsModule,
  ],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.css',
  host: {class: 'container flex-column align-items-center'},
})
export class ColorPickerComponent {
  colorPick = output<string>();

  colorPicker = viewChild.required(ColorPicker);

  protected color = '#ff0000';
  protected colorRGB: RGB = {r: 0, g: 0, b: 0};
  protected colorHSB: HSB = {h: 0, s: 0, b: 0};

  protected format = ColorFormat.HEX;
  protected formatOptions = Object.entries(ColorFormat);
  protected lastFormat = ColorFormat.HEX;

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly ColorFormat = ColorFormat;

  protected getValue() {
    if (this.format === ColorFormat.HSB) {
      return `hsb(${this.colorHSB.h}, ${this.colorHSB.s}, ${this.colorHSB.b})`;
    } else if (this.format === ColorFormat.RGB) {
      return `rgb(${this.colorRGB.r}, ${this.colorRGB.g}, ${this.colorRGB.b})`;
    } else {
      return this.color;
    }
  }

  protected setHSB(hsb: HSB) {
    hsb.h = Math.round(hsb.h);
    hsb.s = Math.round(hsb.s);
    hsb.b = Math.round(hsb.b);
    this.colorHSB = hsb;
  }

  protected formatChanged() {
    const colorPicker = this.colorPicker();

    if (this.lastFormat === ColorFormat.HSB) {
      this.color = `#${colorPicker.HSBtoHEX(this.colorHSB)}`;
      this.colorRGB = colorPicker.HSBtoRGB(this.colorHSB);
    } else if (this.lastFormat === ColorFormat.RGB) {
      this.color = `#${colorPicker.RGBtoHEX(this.colorRGB)}`;
      this.setHSB(colorPicker.RGBtoHSB(this.colorRGB));
    } else {
      this.colorRGB = colorPicker.HEXtoRGB(this.color);
      this.setHSB(colorPicker.HEXtoHSB(this.color));
    }

    this.lastFormat = this.format;
  }
}
